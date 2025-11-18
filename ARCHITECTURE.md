# Architecture Documentation

## System Overview

The Bitespeed Identity Reconciliation Service is a RESTful API built with a clean, modular architecture following enterprise best practices.

## Architecture Principles

1. **Separation of Concerns**: Clear separation between handlers, services, and data access
2. **Single Responsibility**: Each module has a single, well-defined purpose
3. **Dependency Injection**: Services are easily testable and replaceable
4. **Error Handling**: Centralized error handling with custom error classes
5. **Type Safety**: Full TypeScript implementation with strict type checking

## Project Structure

```
src/
├── config/           # Configuration management
│   └── environment.ts
├── database/         # Database connection and setup
│   └── prisma.ts
├── handlers/         # HTTP request handlers
│   └── identify.ts
├── middleware/       # Express middleware
│   ├── errorHandler.ts
│   └── requestLogger.ts
├── services/         # Business logic layer
│   └── contactService.ts
├── types/            # TypeScript type definitions
│   └── index.ts
├── utils/            # Utility functions
│   ├── errors.ts
│   ├── logger.ts
│   └── validation.ts
└── index.ts          # Application entry point
```

## Layer Architecture

### 1. Handler Layer (`handlers/`)
- **Responsibility**: HTTP request/response handling
- **Dependencies**: Services, validation utilities
- **Responsibilities**:
  - Parse and validate HTTP requests
  - Call appropriate services
  - Format HTTP responses
  - Handle errors

### 2. Service Layer (`services/`)
- **Responsibility**: Business logic implementation
- **Dependencies**: Database (Prisma), utilities
- **Responsibilities**:
  - Implement core business rules
  - Coordinate data operations
  - Handle complex business workflows
  - Maintain data consistency

### 3. Data Access Layer (`database/`)
- **Responsibility**: Database interactions
- **Dependencies**: Prisma ORM
- **Responsibilities**:
  - Database connection management
  - Query execution
  - Transaction management

### 4. Utility Layer (`utils/`)
- **Responsibility**: Reusable utility functions
- **Dependencies**: None (pure functions)
- **Responsibilities**:
  - Input validation
  - Logging
  - Error handling
  - Common utilities

## Data Flow

```
HTTP Request
    ↓
Request Logger Middleware
    ↓
Handler (identify.ts)
    ↓
Validation (validation.ts)
    ↓
Service (contactService.ts)
    ↓
Database (Prisma)
    ↓
Response Builder
    ↓
HTTP Response
    ↓
Error Handler (if error)
```

## Key Design Patterns

### 1. Service Pattern
Business logic is encapsulated in service classes/functions, keeping handlers thin.

### 2. Repository Pattern (via Prisma)
Data access is abstracted through Prisma ORM, providing type-safe database operations.

### 3. Middleware Pattern
Cross-cutting concerns (logging, error handling) are handled via Express middleware.

### 4. Singleton Pattern
Prisma client is instantiated as a singleton to prevent connection pool exhaustion.

## Error Handling Strategy

1. **Validation Errors**: Caught at handler level, return 400
2. **Business Logic Errors**: Thrown from services, caught by error handler
3. **Database Errors**: Wrapped in DatabaseError, caught by error handler
4. **Unexpected Errors**: Caught by error handler, return 500 (details hidden in production)

## Security Considerations

1. **Input Validation**: All inputs are validated and sanitized
2. **SQL Injection**: Prevented by Prisma ORM parameterized queries
3. **Error Information**: Sensitive details hidden in production
4. **CORS**: Configured for cross-origin requests
5. **Environment Variables**: Sensitive data stored in environment variables

## Performance Optimizations

1. **Database Indexing**: Indexes on email, phoneNumber, and linkedId
2. **Connection Pooling**: Prisma manages connection pool
3. **Efficient Queries**: Optimized queries with proper WHERE clauses
4. **Transitive Linking**: Efficient algorithm for finding related contacts

## Scalability Considerations

1. **Stateless Design**: No server-side session state
2. **Database Scaling**: Can scale horizontally with read replicas
3. **Caching**: Can add Redis for frequently accessed contacts
4. **Load Balancing**: Stateless design allows horizontal scaling

## Testing Strategy

1. **Unit Tests**: Test individual functions and services
2. **Integration Tests**: Test API endpoints
3. **E2E Tests**: Test complete workflows
4. **Manual Testing**: Comprehensive test cases in TESTING_GUIDE.md

## Future Enhancements

1. **Caching Layer**: Redis for frequently accessed contacts
2. **Rate Limiting**: Prevent abuse
3. **Metrics & Monitoring**: Add Prometheus metrics
4. **API Versioning**: Support multiple API versions
5. **GraphQL**: Alternative API interface
6. **Event Sourcing**: Track all identity changes

