import { slackApp } from './app';
import { getEndpointRepository } from '../database/repos/endpoint';
import { isValidUrl } from '../common/validation';
import { formatEndpointList } from '../common/formatting';

export function registerCommands(): void {
  slackApp.command('/apiwatch', async ({ command, ack, respond }) => {
    await ack();

    const args = command.text.trim().split(/\s+/);
    const subcommand = args[0]?.toLowerCase();
    const channelId = command.channel_id;

    try {
      switch (subcommand) {
        case 'add': {
          const url = args[1];
          if (!url) {
            await respond({
              text: 'Usage: `/apiwatch add <url>`\nExample: `/apiwatch add https://api.example.com/swagger.json`',
              response_type: 'ephemeral',
            });
            return;
          }

          if (!isValidUrl(url)) {
            await respond({
              text: '❌ Invalid URL. Please provide a valid HTTP/HTTPS URL.',
              response_type: 'ephemeral',
            });
            return;
          }

          await getEndpointRepository().add(url, channelId);
          await respond({
            text: `✅ Started monitoring \`${url}\` in this channel.`,
            response_type: 'ephemeral',
          });
          break;
        }

        case 'rm':
        case 'remove': {
          const url = args[1];
          if (!url) {
            await respond({
              text: 'Usage: `/apiwatch rm <url>`\nExample: `/apiwatch rm https://api.example.com/swagger.json`',
              response_type: 'ephemeral',
            });
            return;
          }

          const removed = await getEndpointRepository().remove(url, channelId);
          if (removed) {
            await respond({
              text: `✅ Stopped monitoring \`${url}\` in this channel.`,
              response_type: 'ephemeral',
            });
          } else {
            await respond({
              text: `❌ \`${url}\` is not being monitored in this channel.`,
              response_type: 'ephemeral',
            });
          }
          break;
        }

        case 'list': {
          const endpoints = await getEndpointRepository().findByChannel(channelId);
          const message = formatEndpointList(endpoints);
          await respond({
            text: message,
            response_type: 'ephemeral',
          });
          break;
        }

        default: {
          await respond({
            text: `Available commands:
• \`/apiwatch add <url>\` - Start monitoring an API endpoint
• \`/apiwatch rm <url>\` - Stop monitoring an API endpoint  
• \`/apiwatch list\` - List monitored endpoints in this channel`,
            response_type: 'ephemeral',
          });
          break;
        }
      }
    } catch (error) {
      console.error('Error handling /apiwatch command:', error);
      await respond({
        text: '❌ An error occurred while processing your request. Please try again.',
        response_type: 'ephemeral',
      });
    }
  });
} 
