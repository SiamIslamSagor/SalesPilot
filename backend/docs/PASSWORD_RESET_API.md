# Password Reset API Documentation

This document describes the password reset functionality implemented using Resend.com for email delivery.

## Overview

The password reset feature allows users to reset their password securely through a token-based email verification process. The implementation includes:

- Secure token generation using Node.js crypto
- Token expiration (15 minutes)
- Email delivery via Resend.com
- Frontend integration with React

## Environment Variables

Required environment variables for the backend:

```env
# Resend Email Service Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
EMAIL_FROM=no-reply@yourdomain.com

# Frontend URL (used for password reset links)
FRONTEND_URL=http://localhost:3000
```

### Getting Your Resend API Key

1. Sign up at [https://resend.com](https://resend.com)
2. Navigate to API Keys section
3. Create a new API key
4. Add the key to your `.env` file

### Setting Up Email Domain

1. In your Resend dashboard, go to Domains
2. Add your domain (e.g., `yourdomain.com`)
3. Verify the domain by adding the DNS records provided
4. Once verified, update `EMAIL_FROM` with your verified domain

### Testing Without Domain Verification

For development and testing, you can use the free Resend email address:

```env
EMAIL_FROM=onboarding@resend.dev
```

This works without domain verification and is perfect for development and staging.

## API Endpoints

### 1. Forgot Password

Request a password reset email.

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

**Response (Validation Error):**

```json
{
  "success": false,
  "message": "Validation Error",
  "errors": [
    {
      "type": "field",
      "value": "",
      "msg": "Email is required",
      "path": "email",
      "location": "body"
    }
  ]
}
```

**Security Note:** The endpoint always returns a success message, even if the email doesn't exist, to prevent email enumeration attacks.

### 2. Reset Password

Reset password using the token from the email.

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**

```json
{
  "token": "abc123def456...",
  "password": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

**Password Requirements:**

- Minimum 6 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Response (Success):**

```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

**Response (Error):**

```json
{
  "success": false,
  "message": "Invalid or expired reset token. Please request a new password reset."
}
```

**Response (Validation Error):**

```json
{
  "success": false,
  "message": "Validation Error",
  "errors": [
    {
      "type": "field",
      "value": "weak",
      "msg": "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      "path": "password",
      "location": "body"
    }
  ]
}
```

## Database Schema

The User model includes the following fields for password reset:

```typescript
{
  resetPasswordToken: string; // Hashed reset token
  resetPasswordExpire: Date; // Token expiration timestamp
}
```

These fields are not selected by default (select: false) for security.

## Email Template

The password reset email includes:

- Simple HTML design
- Reset button with token
- Security warning about link expiration

**Email Subject:** "Reset your password"

**Reset Link Format:** `{FRONTEND_URL}/reset-password/{token}`

## Frontend Integration

### Forgot Password Page

Located at: `/forgot-password`

Features:

- Email input form
- Loading states
- Error handling
- Success confirmation

### Reset Password Page

Located at: `/reset-password/:token`

Features:

- Token validation from URL path parameter
- Password strength requirements
- Password confirmation
- Loading states
- Error handling
- Success confirmation
- Invalid/expired token handling

## Security Features

1. **Token Hashing:** Reset tokens are hashed using SHA-256 before storage
2. **Token Expiration:** Tokens expire after 15 minutes
3. **Email Enumeration Prevention:** Always returns success message
4. **Password Requirements:** Enforces strong password policies
5. **Secure Storage:** Reset fields are not selected by default
6. **One-Time Use:** Tokens are cleared after successful password reset

## Testing the Flow

1. **Request Password Reset:**

   ```bash
   curl -X POST http://localhost:5000/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

2. **Check Email:** Look for the reset email in your inbox (or Resend logs)

3. **Reset Password:**

   ```bash
   curl -X POST http://localhost:5000/api/auth/reset-password \
     -H "Content-Type: application/json" \
     -d '{"token":"YOUR_TOKEN_HERE","password":"NewPass123","confirmPassword":"NewPass123"}'
   ```

4. **Login with New Password:** Test login with the new password

## Troubleshooting

### Email Not Received

1. Check Resend dashboard for email logs
2. Verify `RESEND_API_KEY` is correct
3. Verify `EMAIL_FROM` domain is verified (or use `onboarding@resend.dev` for testing)
4. Check spam/junk folder
5. Ensure frontend URL is correct

### Invalid Token Error

1. Check if token has expired (15 minutes limit)
2. Verify token is not truncated in URL
3. Check browser console for token parameter

### Password Reset Not Working

1. Check backend logs for errors
2. Verify database connection
3. Ensure User model has reset fields
4. Check token generation and hashing

## Development Notes

- The crypto module is built-in to Node.js (no external package needed)
- Tokens are 32 bytes (64 hex characters) before hashing
- Email service gracefully handles missing API key (logs error)
- Frontend API service includes comprehensive error handling
- Use `onboarding@resend.dev` for testing without domain verification

## Production Best Practices

### Domain Setup

- Add and verify your domain in Resend dashboard
- Configure SPF, DKIM, and DMARC records
- Use your verified domain in `EMAIL_FROM`

### Rate Limiting

Protect the forgot password endpoint from abuse:

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from "express-rate-limit";

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many password reset requests, please try again later.",
});

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  authController.forgotPassword,
);
```

## Future Enhancements

Potential improvements:

- Rate limiting for forgot password requests
- Email resend functionality
- Password history tracking
- Multi-factor authentication
- Password strength meter on frontend
- Email template customization
