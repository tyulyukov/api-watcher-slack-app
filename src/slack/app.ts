import { App, ExpressReceiver } from '@slack/bolt';
import { config } from '../config';

const receiver = new ExpressReceiver({
  signingSecret: config.slack.signingSecret,
  endpoints: '/slack/events',
});

export const slackApp = new App({
  token: config.slack.botToken,
  receiver,
});

slackApp.error(async (error) => {
  console.error('Slack app error:', error);
});

export const expressApp = receiver.app; 