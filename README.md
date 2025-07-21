# API Watcher Slack App

A production-ready Slack app that monitors OpenAPI/Swagger endpoints for changes and posts summaries to Slack channels when differences are detected.

## Features

- 🔍 **Real-time Monitoring**: Checks API endpoints every minute for changes
- 📊 **Smart Diffing**: Uses `openapi-diff` to detect breaking/non-breaking changes
- 💾 **Version History**: Stores up to 50 versions per endpoint with automatic cleanup
- 🔔 **Slack Integration**: Posts formatted change summaries with Block Kit UI
- ⚡ **Slash Commands**: Easy endpoint management via `/apiwatch` commands
- 🛡️ **Error Handling**: Robust error handling and logging throughout
- 🏗️ **Modular Architecture**: Clean separation of concerns with focused modules

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Slack**: Slack Bolt for JavaScript
- **Database**: MongoDB for persistence
- **Scheduling**: node-cron for periodic checks
- **Deployment**: Railway-ready (uses `PORT` env variable)

## Modular Architecture

The application follows the Single Responsibility Principle with a clean modular structure:

```
src/
├── app.ts                          # Main application entry point
├── config.ts                       # Environment configuration
├── database/
│   ├── connection.ts              # Database connection management
│   └── models/
│       ├── endpoint.ts            # Endpoint model + repository
│       └── version.ts             # Version model + repository
├── common/
│   ├── crypto/index.ts            # SHA-256 hashing utilities
│   ├── validation/index.ts        # URL validation utilities
│   └── formatting/index.ts        # List formatting utilities
├── api/
│   ├── types.ts                   # API-related types
│   ├── fetcher/index.ts           # OpenAPI spec fetching
│   └── diff/index.ts              # API diffing and analysis
├── slack/
│   ├── types.ts                   # Slack-related types
│   ├── app.ts                     # Slack Bolt app setup
│   ├── commands/index.ts          # Slash command handlers
│   └── formatting/index.ts        # Block Kit formatting
└── monitoring/
    ├── types.ts                   # Monitoring-related types
    └── service/index.ts           # Monitoring service + cron
```

### Key Architecture Principles

- **Single Responsibility**: Each module has one focused purpose
- **Separation of Concerns**: Database, API, Slack, and monitoring logic are isolated
- **Dependency Injection**: Services depend on abstractions, not implementations
- **Type Safety**: Full TypeScript coverage with strict mode
- **Error Boundaries**: Isolated error handling prevents cascade failures

## Installation

### 1. Clone and Install Dependencies

```bash
git clone <your-repo>
cd api-watcher-slack-app
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Get these from your Slack app configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
SLACK_APP_TOKEN=xapp-your-app-token-here

# MongoDB connection string
MONGO_URI=mongodb://localhost:27017/api-watcher

# Server port (Railway sets this automatically)
PORT=3000
```

### 3. Slack App Setup

Create a new Slack app at [api.slack.com/apps](https://api.slack.com/apps) with these settings:

**OAuth & Permissions - Bot Token Scopes:**
- `chat:write`
- `commands`  
- `app_home:read`
- `app_home:write`
- `channels:read`

**Slash Commands:**
- Command: `/apiwatch`
- Request URL: `https://your-domain.railway.app/slack/events`
- Description: "Monitor API endpoints for changes"

**Event Subscriptions:**
- Request URL: `https://your-domain.railway.app/slack/events`

**App Home:**
- Always Show My Bot as Online: ✅

### 4. Local Development

```bash
# Development with auto-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

For local development, use ngrok to expose your local server:

```bash
ngrok http 3000
# Use the https URL for your Slack app's request URL
```

## Usage

### Slash Commands

Invite the bot to your channel, then use these commands:

#### Add an endpoint to monitor
```
/apiwatch add https://api.example.com/swagger.json
```

#### Remove an endpoint  
```
/apiwatch rm https://api.example.com/swagger.json
```

#### List monitored endpoints
```
/apiwatch list
```

### What Gets Monitored

The app fetches each endpoint every minute and:

1. ✅ **Computes SHA-256** of the JSON response
2. 🔍 **Compares** with the last known hash
3. 📊 **Diffs** changes using openapi-diff (if changed)
4. 💬 **Posts** to Slack with change summary
5. 💾 **Stores** new version (max 50 per endpoint)

### Sample Slack Message

When changes are detected, you'll see a message like:

```
🔄 API Changes Detected

Endpoint: https://api.example.com/swagger.json

⚠️ breaking: 2 • ➕ added: 5 • ➖ removed: 1

[JSON diff details or "View full diff" file attachment]
```

## Module Details

### Database Module (`database/`)
- **Connection**: Centralized MongoDB connection management
- **Models**: Endpoint and Version models with their repositories
- **Repositories**: Data access patterns with business logic

### Common Module (`common/`)
- **Crypto**: SHA-256 hashing for change detection
- **Validation**: URL validation utilities
- **Formatting**: Reusable formatting functions

### API Module (`api/`)
- **Fetcher**: OpenAPI specification retrieval
- **Diff**: Specification comparison and analysis
- **Types**: API-related type definitions

### Slack Module (`slack/`)
- **App**: Slack Bolt application setup
- **Commands**: Slash command handlers
- **Formatting**: Block Kit message formatting
- **Types**: Slack-specific type definitions

### Monitoring Module (`monitoring/`)
- **Service**: Cron-based monitoring service
- **Types**: Monitoring-related type definitions

## Deployment

### Railway Deployment

1. **Connect Repository**: Link your GitHub repo to Railway
2. **Environment Variables**: Set the required env vars in Railway dashboard
3. **MongoDB**: Use Railway's MongoDB addon or external provider
4. **Custom Domain**: Optional - set up custom domain for Slack webhooks

The app automatically uses Railway's `PORT` environment variable.

### Manual Deployment

```bash
npm run build
PORT=3000 MONGO_URI=<your-mongo-uri> npm start
```

## Development

### Key Features

- **Graceful Shutdown**: Handles SIGINT/SIGTERM properly
- **Error Recovery**: Individual endpoint failures don't crash the service
- **Version Limits**: Automatically maintains 50-version limit per endpoint
- **Concurrent Safe**: Prevents overlapping monitoring cycles
- **Slack Rate Limits**: Built-in protection via Slack Bolt

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the modular architecture
4. Add tests if applicable  
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 