export interface SlackCommand {
  text: string;
  channel_id: string;
  user_id: string;
}

export interface SlackResponse {
  text: string;
  response_type: 'ephemeral' | 'in_channel';
} 