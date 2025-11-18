# Bitespeed Identity Reconciliation Service

A robust REST API service that identifies and tracks customer identity across multiple purchases by intelligently linking contacts based on shared email addresses or phone numbers. This service solves the challenge of maintaining a unified customer identity when customers use different contact information for different transactions.

## 🎯 Problem Statement

In e-commerce platforms, customers often use different email addresses and phone numbers across multiple purchases. This service reconciles these identities by:

- Linking contacts that share either an email or phone number
- Maintaining a primary-secondary relationship hierarchy (oldest contact is always primary)
- Automatically merging multiple primary contacts when they need to be linked
- Providing a consolidated view of all linked contact information

## ✨ Features

- **Identity Reconciliation**: Automatically links contacts sharing email or phone number
- **Primary/Secondary Hierarchy**: Maintains the oldest contact as primary, others as secondary
- **Automatic Merging**: Handles merging of multiple primary contacts intelligently
- **Transitive Linking**: Links contacts transitively (if A links to B and B links to C, all are linked)
- **Consolidated Response**: Returns all linked emails, phone numbers, and secondary contact IDs
- **Type-Safe**: Built with TypeScript for type safety and better developer experience
- **Database Agnostic**: Uses Prisma ORM for easy database switching

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Development**: ts-node-dev for hot reloading

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **PostgreSQL** (v12 or higher) or Docker with PostgreSQL
- **Git** (for cloning the repository)

## 🚀 Quick Start

> **New to this project?** See [GETTING_STARTED.md](./GETTING_STARTED.md) for a detailed step-by-step guide.

### 1. Clone the Repository

```bash
git clone <repository-url>
cd project1
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
PORT=3000
NODE_ENV=development
```

**For Docker PostgreSQL:**
```env
DATABASE_URL="postgresql://bitespeed_user:securepassword@localhost:5434/bitespeed"
PORT=3000
NODE_ENV=development
```

### 4. Set Up Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Sync database schema (for existing database)
npx prisma db push

# Or create migrations (for new database)
npm run prisma:migrate
```

### 5. Start the Server

**Development mode (with hot reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000`

### 6. Test the Application

```bash
# Health check
curl http://localhost:3000/health

# Create a contact
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "phoneNumber": "1234567890"}'
```

## 📚 API Documentation

### Base URL

```
http://localhost:3000
```

### Endpoints

#### 1. Health Check

Check if the service is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok"
}
```

#### 2. Identify Contact

Identifies and links contacts based on email or phone number.

**Endpoint:** `POST /identify`

**Request Body:**
```json
{
  "email": "user@example.com",
  "phoneNumber": "1234567890"
}
```

**Note:** At least one of `email` or `phoneNumber` must be provided.

**Response (200 OK):**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["primary@example.com", "secondary@example.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": [2, 3]
  }
}
```

**Response Fields:**
- `primaryContatctId` (number): ID of the primary contact
- `emails` (string[]): Array of all unique emails (primary's email first)
- `phoneNumbers` (string[]): Array of all unique phone numbers (primary's phone first)
- `secondaryContactIds` (number[]): Array of all secondary contact IDs (sorted ascending)

**Error Responses:**

**400 Bad Request:**
```json
{
  "error": "Either email or phoneNumber must be provided"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

### Example Requests

**Using curl:**
```bash
# Create a new contact
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "phoneNumber": "1234567890"}'

# Query by email only
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Query by phone only
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "1234567890"}'
```

**Using Postman:**
1. Method: `POST`
2. URL: `http://localhost:3000/identify`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
   ```json
   {
     "email": "user@example.com",
     "phoneNumber": "1234567890"
   }
   ```

## 🗄️ Database Schema

### Contact Model

```prisma
model Contact {
  id             Int            @id @default(autoincrement())
  phoneNumber    String?
  email          String?
  linkedId       Int?
  linkPrecedence LinkPrecedence
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  deletedAt      DateTime?

  @@index([email])
  @@index([phoneNumber])
  @@index([linkedId])
}

enum LinkPrecedence {
  primary
  secondary
}
```

**Field Descriptions:**
- `id`: Unique identifier for the contact
- `phoneNumber`: Optional phone number
- `email`: Optional email address
- `linkedId`: ID of the primary contact (null for primary contacts)
- `linkPrecedence`: "primary" or "secondary" (enum)
- `createdAt`: Timestamp when contact was created
- `updatedAt`: Timestamp when contact was last updated
- `deletedAt`: Soft delete timestamp (optional)

## 🔄 How It Works

### 1. New Contact Creation
When no existing contact matches the provided email or phone number, a new primary contact is created with `linkPrecedence="primary"` and `linkedId=null`.

### 2. Contact Linking
If a contact matches by email or phone number:
- The oldest matching contact becomes/is the primary contact
- New information creates a secondary contact linked to the primary
- All contacts sharing any email or phone are transitively linked

### 3. Primary Contact Merging
When two primary contacts need to be linked (they share an email or phone):
- The older contact remains primary
- The newer contact becomes secondary
- All secondaries of the newer primary are updated to point to the older primary

### 4. Response Format
Returns all emails and phone numbers from the linked contact chain, with the primary contact's information appearing first in the arrays.

## 📁 Project Structure

```
project1/
├── prisma/
│   └── schema.prisma              # Database schema definition
├── src/
│   ├── config/
│   │   └── environment.ts        # Environment configuration
│   ├── database/
│   │   └── prisma.ts             # Prisma client singleton
│   ├── handlers/
│   │   └── identify.ts           # HTTP request handlers
│   ├── middleware/
│   │   ├── errorHandler.ts       # Error handling middleware
│   │   └── requestLogger.ts      # Request logging middleware
│   ├── services/
│   │   └── contactService.ts     # Business logic layer
│   ├── types/
│   │   └── index.ts              # TypeScript type definitions
│   ├── utils/
│   │   ├── errors.ts              # Custom error classes
│   │   ├── logger.ts             # Logging utility
│   │   └── validation.ts         # Input validation utilities
│   └── index.ts                  # Application entry point
├── dist/                          # Compiled JavaScript (generated)
├── node_modules/                  # Dependencies (generated)
├── .env                           # Environment variables (create this)
├── .env.example                   # Environment variables template
├── .eslintrc.json                 # ESLint configuration
├── .gitignore                     # Git ignore rules
├── package.json                   # Project dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── ARCHITECTURE.md                # Architecture documentation
├── CHANGELOG.md                   # Version history
├── LICENSE                        # License file
├── README.md                      # This file
└── POSTMAN_TESTING_GUIDE.md       # Testing guide with Postman instructions
```



### View Database

Use Prisma Studio to view and manage your database:

```bash
npm run prisma:studio
```

This opens a GUI at `http://localhost:5555` where you can view and edit contacts.

## 🚢 Deployment

### Prerequisites for Production

1. PostgreSQL database (managed service like AWS RDS, Heroku Postgres, etc.)
2. Environment variables configured
3. Node.js runtime environment

### Deployment Steps

1. **Update Database URL:**
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database"
   ```

2. **Run Migrations:**
   ```bash
   npm run prisma:migrate
   ```

3. **Build the Application:**
   ```bash
   npm run build
   ```

4. **Start the Server:**
   ```bash
   npm start
   ```

### Deployment Platforms

**Render.com:**
1. Connect your GitHub repository
2. Set environment variables (`DATABASE_URL`, `PORT`)
3. Build command: `npm install && npm run build`
4. Start command: `npm start`

**Heroku:**
1. Create a Heroku app
2. Add PostgreSQL addon
3. Set environment variables
4. Deploy using Git

**Docker:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio GUI

## 🔒 Security Considerations

- Input validation for email and phone number formats
- SQL injection protection via Prisma ORM
- Error handling to prevent information leakage
- Environment variables for sensitive data
- CORS enabled for cross-origin requests

## 🐛 Troubleshooting

### Common Issues

**Issue: "Either email or phoneNumber must be provided"**
- Ensure request body is valid JSON
- Check Content-Type header is `application/json`
- Verify values are not null or empty strings

**Issue: Database connection error**
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env` file
- Ensure database credentials are correct

**Issue: Migration errors**
- Run `npm run prisma:generate` first
- Use `npx prisma db push` for development
- Check database permissions

**Issue: Port already in use**
- Change `PORT` in `.env` file
- Or kill the process using port 3000

## 📖 Additional Documentation

- [GETTING_STARTED.md](./GETTING_STARTED.md) - **Start here!** Complete step-by-step setup guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture and design decisions
- [POSTMAN_TESTING_GUIDE.md](./POSTMAN_TESTING_GUIDE.md) - Comprehensive testing guide with Postman instructions
- [CHANGELOG.md](./CHANGELOG.md) - Version history and changes

## 🎓 Key Implementation Details

### Algorithm Complexity
- **Time Complexity**: O(n) where n is the number of contacts to link
- **Space Complexity**: O(n) for storing contact relationships

### Design Decisions
1. **Primary-Secondary Pattern**: Ensures data consistency and easy querying
2. **Transitive Linking**: Automatically links all related contacts
3. **Oldest Contact as Primary**: Maintains historical accuracy
4. **Soft Deletes**: Preserves data integrity with `deletedAt` field
5. **Layered Architecture**: Separation of concerns for maintainability
6. **Type Safety**: Full TypeScript implementation prevents runtime errors
7. **Error Handling**: Custom error classes for better error management
8. **Service Layer**: Business logic separated from HTTP handling

### Code Quality
- **ESLint**: Code linting for consistency
- **TypeScript**: Strict type checking enabled
- **JSDoc Comments**: Comprehensive function documentation
- **Modular Design**: Reusable, testable components




## 👤 Author

**Saurabh Kumar**

Built as part of the Bitespeed Backend Task: Identity Reconciliation

---

## 🎯 Assignment Submission Checklist

- ✅ `/identify` endpoint implemented
- ✅ Handles email and phone number matching
- ✅ Creates primary and secondary contacts correctly
- ✅ Merges primary contacts when needed
- ✅ Returns consolidated contact information
- ✅ Response format matches specification
- ✅ Error handling implemented
- ✅ Database schema matches requirements
- ✅ Code is well-structured and documented
- ✅ Testing guide provided

---

**Thank you for reviewing this project!** 🚀
