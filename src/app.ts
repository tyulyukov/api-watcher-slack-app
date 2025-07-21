import { config } from './config';
import { databaseConnection } from './database';
import { slackApp, expressApp } from './slack/app';
import { registerCommands } from './slack/commands';
import { monitoringService } from './monitoring/service';

const startApplication = async (): Promise<void> => {
  try {
    console.log('🚀 Starting API Watcher Slack App...');

    // Connect to database
    await databaseConnection.connect();
    console.log('✅ Database connected');

    // Initialize Slack app and register commands
    registerCommands();
    await slackApp.start();
    console.log('✅ Slack app started');

    // Start monitoring service
    monitoringService.start();
    console.log('✅ Monitoring service started');

    // Start HTTP server
    expressApp.listen(config.server.port, () => {
      console.log(`🌐 Server listening on port ${config.server.port}`);
      console.log(`📡 Slack events endpoint: http://localhost:${config.server.port}/slack/events`);
    });

    console.log('🎉 API Watcher is ready!');
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
};

const setupGracefulShutdown = (): void => {
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    await databaseConnection.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

setupGracefulShutdown();
startApplication().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
