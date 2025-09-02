# Impulse Backend

[English](README.md) | [中文](docs/cn/README.md)

## Features

- User Management and Authentication (Firebase)
- Community and Group Management
- Instant Messaging (WebSocket)
- Activity Tracking and Management
- Posts and Content Sharing
- Point System and Rewards
- Notifications and Reminders
- Complete GraphQL API

## Tech Stack

- **Backend**: Node.js, TypeScript, Express
- **API**: GraphQL, Apollo Server, Type-GraphQL
- **Database**: PostgreSQL, Prisma ORM
- **Real-time Communication**: GraphQL Subscriptions, WebSocket
- **Task Queue**: Bull, Redis
- **Authentication**: Firebase Admin
- **Logging**: Winston

## Setup

### Prerequisites

You'll need the following installed:

- **Node.js** - JavaScript runtime (download from [nodejs.org](https://nodejs.org/))
- **PostgreSQL** - Database server (download from [postgresql.org](https://www.postgresql.org/download/))
- **Redis** - Cache and message broker

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd Impulse
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment variable configuration** - [Environment Configuration](#environment-configuration) details below
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up database**
```bash
npx prisma migrate dev
```

5. **Start Redis service**
```bash
redis-server

# Check if Redis is running
redis-cli ping
```

6. **Start development server** (in a separate terminal)
```bash
npm run dev
```

The GraphQL server will be available at http://localhost:3000/graphql by default.

### Environment Configuration

Create a `.env` file in the project root and configure the following required environment variables:

#### Required Environment Variables

- `DATABASE_URL` (e.g., `postgresql://username:password@localhost:5432/impulse`)
- `FIREBASE_PROJECT_ID` (e.g., `quizdemov1`)
- `FIREBASE_CLIENT_EMAIL` (e.g., `firebase-adminsdk-xxxxx@quizdemov1.iam.gserviceaccount.com`)
- `FIREBASE_PRIVATE_KEY` (e.g., `-----BEGIN PRIVATE KEY-----\nXXXXX...`)

#### Setting Up Firebase Service Account

1. **Check Firebase access** - Verify access or reach out for permissions
2. Go to [Firebase Service Accounts](https://console.firebase.google.com/project/quizdemov1/settings/serviceaccounts/adminsdk)
3. Click **Generate new private key**
4. Download the JSON file
5. Copy the following values to your `.env` file:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

## Development

### Available Commands

- `npm run dev` - Start development server
- `npm run build` - Compile TypeScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run docs` - Generate documentation

### Documentation Guides

> **Note:** These guides were written by a previous developer and may be slightly unorganized as they haven't been fully reviewed yet.

- **[Project Structure](docs/guides/project-structure.md)** - Architecture overview
- **[Development Guide](docs/guides/development-guide.md)** - Development standards and best practices
- **[Project Guide](docs/guides/project-guide.md)** - Project management and development workflow
- **[Apollo Studio Guide](docs/guides/apollo-studio-guide.md)** - Apollo Studio integration and usage
- **[API Documentation](docs/guides/api-documentation.md)** - Complete GraphQL API reference with examples
- **[GraphQL Subscriptions](docs/guides/subscription-guide.md)** - Real-time communication with WebSocket and PubSub
- **[AWS Guide](docs/guides/aws-guide.md)** - AWS deployment and API usage guide
- **[Error Handling](docs/guides/error-handling-guide.md)** - Structured error handling and validation
- **[Logger Guide](docs/guides/logger-guide.md)** - Winston logging configuration and best practices
- **[TypeDoc Guide](docs/guides/typedoc-guide.md)** - Code documentation generation and standards

### API Reference

- **[Auto-generated Docs](docs/api/)** - Complete TypeScript API documentation

### Basic Contribution Workflow

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## License

This project is licensed under the [MIT License](LICENSE).

