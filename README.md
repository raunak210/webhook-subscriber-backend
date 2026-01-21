# Webhook Subscription System - Backend

A Node.js/Express.js backend for managing webhook subscriptions and handling incoming webhook events from various platforms.

## Features

- 🔐 **JWT Authentication** - Secure user registration and login
- 📡 **Webhook Reception** - Receive webhooks from GitHub, Stripe, Razorpay, Shopify
- 📬 **Webhook Forwarding** - Forward events to subscriber callback URLs with HMAC signatures
- 📊 **Delivery Logging** - Track all delivery attempts with status, response, and errors
- 🎯 **Event Filtering** - Subscribe to specific event types per platform
- 🧪 **Webhook Simulation** - Test the system with simulated webhook events

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/webhook-subscription

# JWT Secret (use a strong random string in production)
JWT_SECRET=your-super-secret-jwt-key-here

# Optional: Platform Webhook Secrets (for signature validation)
GITHUB_WEBHOOK_SECRET=your-github-secret
STRIPE_WEBHOOK_SECRET=your-stripe-secret
RAZORPAY_WEBHOOK_SECRET=your-razorpay-secret
SHOPIFY_WEBHOOK_SECRET=your-shopify-secret
```

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Server port (default: 5000) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key for JWT token signing |
| `*_WEBHOOK_SECRET` | No | Platform-specific secrets for validating incoming webhooks |

### 3. Seed Default Platforms

```bash
npm run seed:platforms
```

This creates default platform configurations (GitHub, Stripe, Razorpay, Shopify).

### 4. Run the Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/check` | Verify token and get user data |

### Subscriptions (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/subscriptions` | Create subscription |
| GET | `/api/subscriptions` | List user's subscriptions |
| GET | `/api/subscriptions/:id` | Get subscription details |
| PUT | `/api/subscriptions/:id` | Update subscription |
| DELETE | `/api/subscriptions/:id` | Delete subscription |
| GET | `/api/subscriptions/logs` | Get delivery logs |

### Platforms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/platforms` | List all platforms |
| POST | `/api/platforms` | Create platform (protected) |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/receive/:platform` | Receive incoming webhooks |
| GET | `/api/webhooks/events` | List webhook events |

### Simulation
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/simulate` | List available platforms |
| POST | `/api/simulate/:platform` | Simulate webhook event |

## Project Structure

```
backend/
├── controllers/
│   ├── auth.controller.js      # User authentication logic
│   ├── platform.controller.js  # Platform CRUD operations
│   ├── subscription.controller.js  # Subscription management
│   ├── webhook.controller.js   # Webhook reception and forwarding
│   └── simulate.controller.js  # Webhook simulation
├── middleware/
│   ├── user.middleware.js      # JWT authentication middleware
│   └── webhook.middleware.js   # Webhook signature validation
├── models/
│   ├── user.model.js           # User schema
│   ├── platform.model.js       # Platform configuration schema
│   ├── subscription.model.js   # Webhook subscription schema
│   ├── webhookEvent.model.js   # Incoming webhook events
│   └── deliveryLog.model.js    # Delivery attempt logs
├── routes/
│   ├── auth.routes.js
│   ├── platform.routes.js
│   ├── subscription.routes.js
│   ├── webhook.routes.js
│   └── simulate.routes.js
├── seeds/
│   └── platforms.seed.js       # Database seeding script
├── index.js                    # App entry point
└── package.json
```

## Design Choices & Architecture Decisions

### 1. **Modular Architecture**
The codebase is organized into separate concerns:
- **Controllers**: Business logic
- **Routes**: API endpoint definitions
- **Models**: Database schemas
- **Middleware**: Request processing (auth, validation)

This separation makes the code maintainable and testable.

### 2. **Dynamic Platform Support**
Platforms are stored in the database rather than hardcoded. This allows:
- Adding new platforms without code changes
- Enabling/disabling platforms via API
- Storing platform-specific configuration (signature headers, event headers)

### 3. **Asynchronous Webhook Forwarding**
```javascript
setImmediate(() => {
    forwardWebhookToSubscribers(webhookEvent, platformName, eventType);
});
```
Webhook forwarding runs asynchronously using `setImmediate()`. This ensures:
- Fast response to incoming webhooks (important for platforms with timeout limits)
- Non-blocking delivery to multiple subscribers
- Better handling of slow subscriber endpoints

### 4. **HMAC Signature Verification**
Both incoming and outgoing webhooks use HMAC-SHA256 signatures:
- **Incoming**: Validates webhooks from external platforms (GitHub, Stripe, etc.)
- **Outgoing**: Signs forwarded webhooks with subscriber's secret key via `X-Webhook-Signature` header

### 5. **Delivery Logging**
Every delivery attempt is logged with:
- Status (pending, success, failed)
- HTTP status code
- Response body (truncated to 1000 chars)
- Error messages
- Timestamps

This provides full visibility into webhook delivery for debugging.

### 6. **JWT Authentication**
Stateless authentication using JSON Web Tokens:
- Tokens expire after 7 days
- No session storage required
- Scalable for horizontal scaling

### 7. **MongoDB Document Structure**
Using MongoDB's flexible schema for:
- Storing arbitrary webhook payloads
- Quick reads for delivery logs
- Compound indexes for efficient queries (user + platform + callbackUrl)

## Error Handling

All endpoints return consistent error responses:
```json
{
    "success": false,
    "message": "Error description"
}
```

HTTP status codes:
- `400` - Bad request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not found
- `500` - Server error

## License

MIT
# webhook-subscriber-backend
