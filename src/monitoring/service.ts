import * as cron from 'node-cron';
import { slackApp } from '../slack/app';
import { getEndpointRepository } from '../database/repos/endpoint';
import { getVersionRepository } from '../database/repos/version';
import { fetchApiSpec } from '../watcher/fetcher';
import { compareSpecs } from '../watcher/diff';
import { sha256 } from '../common/crypto';
import { renderDiffBlocks } from '../slack/formatting';
import { Endpoint } from '../database/repos/endpoint';
import { OpenApiDiffResult } from '../watcher/types';

export class MonitoringService {
  private isRunning = false;

  start(): void {
    console.log('Starting monitoring service...');
    
    cron.schedule('* * * * *', async () => {
      if (this.isRunning) {
        console.log('Previous monitoring cycle still running, skipping...');
        return;
      }

      this.isRunning = true;
      try {
        await this.checkAllEndpoints();
      } catch (error) {
        console.error('Error in monitoring cycle:', error);
      } finally {
        this.isRunning = false;
      }
    });

    console.log('Monitoring service started - checking endpoints every minute');
  }

  private async checkAllEndpoints(): Promise<void> {
    const endpoints = await getEndpointRepository().findAllEnabled();
    console.log(`Checking ${endpoints.length} endpoints...`);

    const promises = endpoints.map(endpoint => this.checkEndpoint(endpoint));
    await Promise.allSettled(promises);
  }

  private async checkEndpoint(endpoint: Endpoint): Promise<void> {
    try {
      console.log(`Checking endpoint: ${endpoint.url}`);

      const currentSpec = await fetchApiSpec(endpoint.url);
      const currentHash = sha256(JSON.stringify(currentSpec));

      // Check if this is the first fetch
      const isFirstFetch = !endpoint.lastHash;
      
      if (!isFirstFetch && currentHash === endpoint.lastHash) {
        console.log(`No changes detected for ${endpoint.url}`);
        return;
      }

      if (isFirstFetch) {
        console.log(`First fetch for endpoint: ${endpoint.url} - establishing baseline`);
      } else {
        console.log(`Changes detected for ${endpoint.url}`);
      }

      const previousVersion = await getVersionRepository().findLatest(endpoint._id!);
      let diff: OpenApiDiffResult | null = null;

      if (previousVersion && !isFirstFetch) {
        diff = await compareSpecs(previousVersion.json, currentSpec);
        console.log(`Diff: ${JSON.stringify(diff, null, 2)}`);
      } else {
        console.log(`No previous version found - this is ${isFirstFetch ? 'first fetch' : 'a new baseline'}`);
      }

      console.log(`Diff: ${JSON.stringify(diff, null, 2)}`);

      await getVersionRepository().store(endpoint._id!, currentHash, currentSpec);
      await getEndpointRepository().updateHash(endpoint._id!, currentHash);
      await getVersionRepository().enforceLimit(endpoint._id!);

      // Always notify on first fetch or when changes are detected
      if (isFirstFetch || diff) {
        await this.notifyChannels(endpoint.channels, diff, endpoint.url, isFirstFetch);
      }

      console.log(`Successfully processed ${isFirstFetch ? 'first fetch' : 'changes'} for ${endpoint.url}`);
    } catch (error) {
      // On error, only log - do NOT notify channels
      console.error(`Error checking endpoint ${endpoint.url}:`, error);
      console.log(`Skipping notification for ${endpoint.url} due to error`);
    }
  }

  private async notifyChannels(
    channels: string[],
    diff: OpenApiDiffResult | null,
    url: string,
    isFirstFetch: boolean = false
  ): Promise<void> {
    const blocks = renderDiffBlocks(diff, url);

    for (const channelId of channels) {
      try {
        const result = await slackApp.client.chat.postMessage({
          channel: channelId,
          blocks,
        });

        // Only upload full diff as file if it's not a first fetch and diff is large
        if (!isFirstFetch && diff && JSON.stringify(diff).length >= 2900) {
          await slackApp.client.files.upload({
            channels: channelId,
            content: JSON.stringify(diff, null, 2),
            filename: `diff-${url.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.json`,
            title: `Full diff for ${url}`,
            thread_ts: result.ts,
          });
        }
      } catch (slackError) {
        console.error(`Error posting to Slack channel ${channelId}:`, slackError);
      }
    }
  }
}

export const monitoringService = new MonitoringService(); 
