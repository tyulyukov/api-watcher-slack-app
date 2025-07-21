import dotenv from 'dotenv';

dotenv.config();

interface Config {
  slack: {
    botToken: string;
    signingSecret: string;
  };
  mongo: {
    uri: string;
  };
  server: {
    port: number;
  };
}

function validateEnv(): Config {
  const botToken = process.env.SLACK_BOT_TOKEN;
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  const mongoUri = process.env.MONGO_URI;

  if (!botToken) {
    throw new Error('SLACK_BOT_TOKEN environment variable is required');
  }

  if (!signingSecret) {
    throw new Error('SLACK_SIGNING_SECRET environment variable is required');
  }

  if (!mongoUri) {
    throw new Error('MONGO_URI environment variable is required');
  }

  return {
    slack: {
      botToken,
      signingSecret,
    },
    mongo: {
      uri: mongoUri,
    },
    server: {
      port: parseInt(process.env.PORT || '3000', 10),
    },
  };
}

export const config = validateEnv(); 
