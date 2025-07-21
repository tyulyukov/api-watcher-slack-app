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

      if (currentHash === endpoint.lastHash) {
        console.log(`No changes detected for ${endpoint.url}`);
        return;
      }

      console.log(`Changes detected for ${endpoint.url}`);

      const previousVersion = await getVersionRepository().findLatest(endpoint._id!);
      let diff: OpenApiDiffResult | null = null;

      if (previousVersion) {
        diff = await compareSpecs(previousVersion.json, currentSpec);
      }

      console.log(`Diff: `, diff);

      await getVersionRepository().store(endpoint._id!, currentHash, currentSpec);
      await getEndpointRepository().updateHash(endpoint._id!, currentHash);
      await getVersionRepository().enforceLimit(endpoint._id!);

      await this.notifyChannels(endpoint.channels, diff, endpoint.url);

      console.log(`Successfully processed changes for ${endpoint.url}`);
    } catch (error) {
      console.error(`Error checking endpoint ${endpoint.url}:`, error);
    }
  }

  private async notifyChannels(
    channels: string[],
    diff: OpenApiDiffResult | null,
    url: string
  ): Promise<void> {
    const blocks = renderDiffBlocks(diff, url);

    for (const channelId of channels) {
      try {
        const result = await slackApp.client.chat.postMessage({
          channel: channelId,
          blocks,
        });

        if (diff && JSON.stringify(diff).length >= 2900) {
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
