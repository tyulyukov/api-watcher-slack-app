import { Block, KnownBlock } from '@slack/bolt';
import { OpenApiDiffResult } from '../watcher/types';
import { analyzeDiff } from '../watcher/diff';

export function renderDiffBlocks(diff: OpenApiDiffResult | null, url: string): (KnownBlock | Block)[] {
  const blocks: (KnownBlock | Block)[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🔄 API Changes Detected',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Endpoint:* ${url}`,
      },
    },
  ];

  if (!diff) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'ℹ️ *First time monitoring this endpoint* - baseline established',
      },
    });
    return blocks;
  }

  const summary = analyzeDiff(diff);
  const totalChanges = summary.breaking + summary.added + summary.removed + summary.deprecated;

  if (totalChanges === 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '✅ No significant changes detected',
      },
    });
    return blocks;
  }

  const changeParts = [];
  if (summary.breaking > 0) changeParts.push(`⚠️ *breaking:* ${summary.breaking}`);
  if (summary.added > 0) changeParts.push(`➕ *added:* ${summary.added}`);
  if (summary.removed > 0) changeParts.push(`➖ *removed:* ${summary.removed}`);
  if (summary.deprecated > 0) changeParts.push(`🚫 *deprecated:* ${summary.deprecated}`);

  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: changeParts.join(' • '),
    },
  });

  const diffJson = JSON.stringify(diff, null, 2);
  if (diffJson.length < 2900) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `\`\`\`json\n${diffJson}\n\`\`\``,
      },
    });
  } else {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '_Diff is too large to display inline. Check the thread for full details._',
      },
    });
  }

  return blocks;
} 
