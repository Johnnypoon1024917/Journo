# Enhanced Authentication System - Design Document

## Architecture Overview

The enhanced authentication system is built on a layered architecture that provides comprehensive security features while maintaining clean separation of concerns.

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  • ChangePasswordModal.tsx (UI Component)                  │
│  • AdminLayout.tsx (Integration)                           │
│  • AuthService.ts (API Communication)                      │
│  • Enhanced Auth Store (State Management)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Layer                               │
├─────────────────────────────────────────────────────────────┤
│  • Enhanced Auth Routes (/api/auth/*)                      │
│  • Enhanced Auth Controller                                │
│  • Validation Middleware                                   │
│  • Rate Limiting Middleware                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                             │
├─────────────────────────────────────────────────────────────┤
│  • EnhancedAuthService (Core Logic)                        │
│  • AuditService (Security Logging)                         │
│  • EmailService (Notifications)                            │
│  • RateLimitService (Protection)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                │
├─────────────────────────────────────────────────────────────┤
│  • PostgreSQL Database                                     │
│  • Users Table (Enhanced Schema)                           │
│  • Password History Table                                  │
│  • User Sessions Table                                     │
│  • Audit Logs Table                                        │
└─────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Frontend Components

#### ChangePasswordModal Component
```typescript
interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordChanged: () => void;
  isFirstLogin?: boolean;
}
```

**Key Features:**
- Professional UI with Tailwind CSS styling
- Real-time password validation with visual indicators
- Show/hide password toggles for all fields
- Non-dismissible modal for first-time login scenarios
- Security requirements display with checkmarks
- Error handling and loading states

**Design Patterns:**
- Controlled components for form inputs
- State management with React hooks
- Conditional rendering based on validation state
- Accessibility features (ARIA labels, keyboard navigation)

#### AdminLayout Integration
```typescript
// Automatic password check on component mount
useEffect(() => {
  const checkDefaultPassword = async () => {
    const result = await AuthService.checkDefaultPassword(accessToken);
    if (result.isUsingDefaultPassword) {
      setShowPasswordModal(true);
    }
  };
  checkDefaultPassword();
}, [user]);
```

**Design Decisions:**
- Check performed on admin layout mount
- Modal state managed at layout level
- Non-intrusive for users who don't need password change
- Graceful error handling if API call fails

### 2. Backend Services

#### EnhancedAuthService Architecture
```typescript
class EnhancedAuthService {
  // Core dependencies injected via constructor
  constructor(
    db: Pool,
    emailService: EmailService,
    auditService: AuditService,
    rateLimitService: RateLimitService
  )
  
  // Key methods for password management
  async isUsingDefaultPassword(userId: string): Promise<boolean>
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<Result>
  async checkPasswordHistory(userId: string, newPassword: string): Promise<boolean>
}
```

**Design Principles:**
- Dependency injection for testability
- Single responsibility principle
- Comprehensive error handling
- Audit logging for all security events
- Rate limiting integration

#### Password Security Design
```typescript
// Default password detection logic
const isDefaultPassword = (user: User): boolean => {
  if (!user.password_changed_at) return true;
  
  const createdAt = new Date(user.created_at).getTime();
  const passwordChangedAt = new Date(user.password_changed_at).getTime();
  const timeDiff = Math.abs(passwordChangedAt - createdAt);
  
  return timeDiff < 1000; // Within 1 second = default
};
```

**Security Features:**
- Time-based default password detection
- Password history tracking (12 previous passwords)
- Bcrypt hashing with 12 salt rounds
- Session invalidation after password change
- Comprehensive audit logging

### 3. API Design

#### RESTful Endpoints
```
GET  /api/auth/check-default-password  - Check default password status
POST /api/auth/change-password         - Change user password
POST /api/auth/logout                  - Logout with cookie handling
GET  /api/notifications                - Get notifications (fixed auth)
```

**Design Patterns:**
- RESTful resource naming
- Consistent response format
- Proper HTTP status codes
- Comprehensive error messages
- Rate limiting on all endpoints

#### Authentication Flow
```
1. User Login → JWT Access Token + HttpOnly Refresh Cookie
2. API Requests → Bearer Token in Authorization Header
3. Token Refresh → Cookie-based Refresh Token Exchange
4. Logout → Cookie Clearing + Session Invalidation
```

## Database Schema Design

### Enhanced Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user',
  email_verified BOOLEAN DEFAULT FALSE,
  failed_login_attempts INTEGER DEFAULT 0,
  account_locked_until TIMESTAMP,
  last_login TIMESTAMP,
  password_changed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Password History Table
```sql
CREATE TABLE password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### User Sessions Table
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used TIMESTAMP DEFAULT NOW()
);
```

## Security Design

### Password Policy
```typescript
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  historyLimit: 12,
  saltRounds: 12
};
```

### Rate Limiting Strategy
```typescript
const RATE_LIMITS = {
  login: { attempts: 10, window: 15 * 60 * 1000 },      // 10 per 15 min
  register: { attempts: 5, window: 60 * 60 * 1000 },    // 5 per hour
  password_reset: { attempts: 3, window: 60 * 60 * 1000 }, // 3 per hour
  api_general: { attempts: 100, window: 60 * 1000 },    // 100 per minute
  api_sensitive: { attempts: 20, window: 60 * 1000 }    // 20 per minute
};
```

### Audit Logging Design
```typescript
interface AuditLogEntry {
  userId?: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  timestamp: Date;
}
```

## Error Handling Design

### Frontend Error Handling
```typescript
// Centralized error handling in components
const handlePasswordChange = async () => {
  try {
    await AuthService.changePassword(currentPassword, newPassword);
    onPasswordChanged();
  } catch (error) {
    setError(error.message || 'Password change failed');
  }
};
```

### Backend Error Handling
```typescript
// Consistent error response format
const errorResponse = {
  success: false,
  message: 'User-friendly error message',
  code: 'ERROR_CODE',
  details?: 'Additional technical details'
};
```

## Integration Points

### Cookie-Parser Integration
```typescript
// Server configuration
app.use(cookieParser());

// Controller usage
const refreshToken = req.cookies.refreshToken;
```

### Enhanced Auth Middleware
```typescript
// Middleware factory pattern
export function createEnhancedAuthMiddleware(db: Pool) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // JWT validation and user attachment logic
  };
}
```

## Testing Strategy

### Unit Testing
- Service layer methods with mocked dependencies
- Password validation logic
- Default password detection
- Error handling scenarios

### Integration Testing
- API endpoint testing with real database
- Authentication flow testing
- Cookie handling verification
- Rate limiting validation

### Frontend Testing
- Component rendering tests
- User interaction testing
- Form validation testing
- API integration testing

## Performance Considerations

### Database Optimization
- Indexes on frequently queried columns (email, user_id)
- Connection pooling for database access
- Efficient password history queries with LIMIT

### Caching Strategy
- JWT token validation caching
- Rate limit counters in Redis
- Session data caching

### Frontend Optimization
- Lazy loading of password modal
- Debounced password validation
- Optimistic UI updates

## Deployment Considerations

### Environment Variables
```bash
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
COOKIE_SECRET=your-cookie-secret
NODE_ENV=production
```

### Security Headers
```typescript
// Production security headers
app.use(helmet());
app.use(cors({ credentials: true, origin: allowedOrigins }));
```

### Database Migrations
- Automated migration system
- Rollback capabilities
- Data integrity checks

## Monitoring and Observability

### Metrics to Track
- Authentication success/failure rates
- Password change frequency
- Account lockout incidents
- API response times
- Error rates by endpoint

### Logging Strategy
- Structured logging with correlation IDs
- Security event logging
- Performance metrics logging
- Error tracking and alerting

## Future Extensibility

### Planned Enhancements
- Two-factor authentication support
- OAuth provider integration
- Advanced session management
- Security dashboard for admins

### Architecture Flexibility
- Plugin-based authentication providers
- Configurable password policies
- Extensible audit logging
- Modular security features

This design provides a solid foundation for secure authentication while maintaining flexibility for future enhancements and scalability requirements.