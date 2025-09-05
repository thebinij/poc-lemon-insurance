# Lemon Insurance Backend

A comprehensive backend system built with Node.js, Express, Parse Server, MongoDB, AWS SQS, and Lambda functions. This architecture provides a scalable foundation for authentication, data management, and event processing.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Main Baas       │    │  Parse Server   │    │     MongoDB     │
│ Server          │◄──►│  (BaaS Layer)   │◄──►│   (Database)    │
│ (Express)       │    │  (Docker)       │    │   (Cloud)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AWS SQS       │    │   Lambda        │    │   LocalStack    │
│   (Queue)       │◄──►│   Functions     │◄──►│   (Local AWS)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Components

- **Main Baas Server**: Express.js REST API for user authentication (signup/login) running locally
- **Parse Server**: Backend-as-a-Service for data management running in Docker container
- **MongoDB**: Cloud database instance managed through Parse Server
- **AWS SQS**: Message queue for event processing
- **Lambda Functions**: Serverless event processors
- **Bruno**: API testing tool integrated within main-baas-server
- **LocalStack**: Local AWS services emulator for development

## Quick Start

### Prerequisites

- Node.js 20+ 
- Docker & Docker Compose
- npm or yarn

### 1. Clone and Setup

```bash
git clone <repository-url>
cd poc-lemon-insurance
npm run setup
```

### 2. Environment Configuration

```bash
# Copy environment files
cp main-baas-server/env.example main-baas-server/.env

# Edit main-baas-server/.env with your configuration
# Most values can be left as defaults for local development
```

### 3. Start the Stack

```bash
# Start Parse Server with Docker Compose
npm run docker:up

# Start all services (Main Baas Server + Lambda + Bruno)
npm run dev
```

### 4. Verify Services

- **Main Baas Server**: http://localhost:3000
- **Parse Server**: http://localhost:1337/parse
- **Bruno (API Testing)**: http://localhost:3001
- **MongoDB**: Cloud instance (140.238.225.133:30127)

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Individual Service Tests

```bash
# Main Baas Server tests
npm run test:main-baas

# Lambda function tests
npm run test:lambda
```

### API Testing with Bruno

Bruno is integrated within main-baas-server and provides:
- Authentication endpoint testing
- Parse Server endpoint testing
- Environment management (local, staging, production)
- Request/response examples

## API Endpoints

### Authentication

```
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/profile
GET  /api/auth/users      # Admin only
GET  /api/auth/events     # Admin only
```

### Health Checks

```
GET /health
GET /health/ready
```

### Parse Server

```
POST /parse/classes/User
GET  /parse/classes/User
POST /parse/classes/AuthEvent
GET  /parse/Workflow
```

## Event Flow

1. **User Action**: User signs up or logs in via Main Baas Server
2. **SQS Message**: Main Baas Server publishes event to SQS queue
3. **Lambda Trigger**: SQS triggers Lambda function automatically
4. **Parse Update**: Lambda updates event status and creates workflow records
5. **Data Persistence**: All data stored in MongoDB via Parse Server

### Example Event Flow

```bash
# 1. Create user
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'

# 2. Check Parse Server data
curl -X GET "http://localhost:1337/parse/classes/AuthEvent" \
  -H "X-Parse-Application-Id: lemon-insurance-app-id" \
  -H "X-Parse-Master-Key: lemon-insurance-master-key"
```

## Database Schema

### Core Collections

- **`_User`**: User accounts and authentication
- **`AuthEvent`**: Authentication events (signup/login)
- **`Workflow`**: Business process workflows
- **`UserOnboarding`**: User onboarding steps
- **`UserActivity`**: User activity logs
- **`GenericEvent`**: Other system events

### Custom Collections

Lambda functions can create their own collections dynamically:

```javascript
// In Lambda function
await parseClient.createCustomRecord('InsurancePolicy', {
  userId: 'user-123',
  policyType: 'auto',
  status: 'active',
  premium: 150.00
});
```

## Docker Services

### Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Main Baas Server | 3000 | Express.js REST API |
| Parse Server | 1337 | Backend-as-a-Service |
| Bruno | 3001 | API Testing Tool |
| MongoDB | Cloud | Cloud database instance |

### Docker Commands

```bash
# Start Parse Server
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild services
docker-compose up --build -d
```

## 🚀 Development Workflow

### Local Development

```bash
# Start everything locally
npm run docker:up
npm run dev
```

### Service Startup Order

1. **Parse Server**: Start first with `npm run docker:up` (runs on port 1337)
2. **Main Baas Server**: Start with `npm run dev:main-baas` (runs on port 3000, connects to Parse Server)
3. **Lambda**: Start with `npm run dev:lambda` (runs locally for testing)
4. **Bruno**: Start with `npm run dev:bruno` (runs on port 3001 for API testing)

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Main Baas Server port | `3000` |
| `MONGODB_URI` | MongoDB connection | `mongodb://140.238.225.133:30127/poc-lemon` |
| `PARSE_APP_ID` | Parse Server app ID | `lemon-insurance-app-id` |
| `PARSE_MASTER_KEY` | Parse Server master key | `lemon-insurance-master-key` |
| `PARSE_JS_KEY` | Parse Server JS key | `lemon-insurance-js-key` |

### Parse Server Configuration

Parse Server is configured with:
- Cloud MongoDB instance
- File storage using Docker volumes
- Security settings with master keys
- LiveQuery support for real-time updates

## Testing Strategies

### Unit Tests

- **Main Baas Server**: API endpoints, validation, business logic
- **Lambda Functions**: Message processing, Parse Server integration
- **Parse Service**: Data operations, error handling

### Integration Tests

- **End-to-End**: Complete user signup → SQS → Lambda → Parse flow
- **Database**: MongoDB operations via Parse Server
- **API Testing**: Bruno collections for endpoint testing

## 🔍 Monitoring & Debugging

### Logs

```bash
# View Parse Server logs
npm run docker:logs

# View specific service logs
docker-compose logs -f parse-server
```

### Parse Server Dashboard

Access Parse Server dashboard at: http://localhost:1337/parse

### Bruno API Testing

Access Bruno at: http://localhost:3001

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 1337, 3001 are available
2. **MongoDB connection**: Check MongoDB cloud instance is accessible
3. **Parse Server**: Check environment variables and Docker container
4. **File storage**: Docker Parse Server handles file storage automatically

### Debug Mode

```bash
# Enable debug logging
export DEBUG=*
npm run dev

# View detailed Docker logs
docker-compose logs -f --tail=100
```

## 📚 Additional Resources

- [Parse Server Documentation](https://docs.parseplatform.org/parse-server/guide/)
- [AWS SQS Developer Guide](https://docs.aws.amazon.com/sqs/)
- [Bruno Documentation](https://www.usebruno.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Note**: This is a proof-of-concept implementation. For production use, ensure proper security measures, environment configuration, and monitoring are in place.

**Architecture**: Parse Server runs in Docker (port 1337), Main Baas Server runs locally (port 3000), Lambda runs locally, all connecting to MongoDB.

### Bruno Integration

Bruno is located at the root level and provides:
- **API Testing**: Test all endpoints with Bruno collections
- **Documentation**: Maintain up-to-date API documentation
- **Environment Management**: Different environments for local, staging, production
- **Request/Response Examples**: Provide examples for all endpoints
