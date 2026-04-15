# Password Reset Flow Documentation

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FORGOT PASSWORD FLOW                         │
└─────────────────────────────────────────────────────────────────────────┘

1. USER ACTION
   └─> User clicks "Forgot Password" link on login page
       └─> Navigates to: /forgot-password

2. FRONTEND: ForgotPassword.tsx
   └─> User enters email address
   └─> User submits form
   └─> Calls: api.forgotPassword(email)
       └─> POST /api/auth/forgot-password
           Body: { "email": "user@example.com" }

3. BACKEND: forgotPassword endpoint
   └─> Validator: forgotPasswordValidation
       └─> Validates email format
   └─> Service: authService.forgotPassword(email)
       └─> Find user by email
       └─> Generate random token (32 bytes, hex)
       └─> Hash token with SHA-256
       └─> Set expiration: Date.now() + 15 minutes
       └─> Save to user document:
           - resetPasswordToken: hashed_token
           - resetPasswordExpire: timestamp
       └─> Create reset URL:
           - Format: {FRONTEND_URL}/reset-password/{token}
           - Example: http://localhost:3000/reset-password/abc123...
       └─> Send email via Resend:
           - To: user.email
           - From: EMAIL_FROM (or onboarding@resend.dev)
           - Subject: "Reset your password"
           - HTML: Contains reset button with URL

4. EMAIL DELIVERY
   └─> User receives email
   └─> Email contains button/link: {FRONTEND_URL}/reset-password/{token}
   └─> User clicks the link

5. USER ACTION
   └─> Navigates to: /reset-password/:token
       └─> Token is in URL path parameter

6. FRONTEND: ResetPassword.tsx
   └─> Extracts token using useParams()
   └─> Validates token exists
   └─> User enters new password
   └─> User confirms password
   └─> Client-side validation:
       - Minimum 6 characters
       - At least one uppercase letter
       - At least one lowercase letter
       - At least one number
       - Passwords match
   └─> User submits form
   └─> Calls: api.resetPasswordWithToken(token, password, confirmPassword)
       └─> POST /api/auth/reset-password
           Body: {
             "token": "abc123...",
             "password": "NewPass123",
             "confirmPassword": "NewPass123"
           }

7. BACKEND: resetPassword endpoint
   └─> Validator: resetPasswordValidation
       └─> Validates token exists
       └─> Validates password format
       └─> Validates confirmPassword matches password
   └─> Service: authService.resetPassword(token, password)
       └─> Hash incoming token with SHA-256
       └─> Find user by:
           - resetPasswordToken: hashed_token
           - resetPasswordExpire: { $gt: Date.now() }
       └─> If user not found or token expired:
           - Return error: "Invalid or expired reset token"
       └─> If user found:
           - Update user.password = newPassword
           - Clear resetPasswordToken = undefined
           - Clear resetPasswordExpire = undefined
           - Save user document
           - Return success

8. FRONTEND: Success State
   └─> Display success message
   └─> Show "Back to Login" button
   └─> User clicks button
   └─> Navigates to: /

9. USER ACTION
   └─> User logs in with new password
   └─> Flow complete!

┌─────────────────────────────────────────────────────────────────────────┐
│                      ERROR HANDLING FLOW                             │
└─────────────────────────────────────────────────────────────────────────┘

INVALID EMAIL
  Frontend: Email validation error
  Backend: Returns success (security - prevents enumeration)

USER NOT FOUND
  Backend: Returns success (security - prevents enumeration)
  Email: Not sent

EMAIL NOT SENT
  Backend: Logs error
  Frontend: Shows success (security - prevents enumeration)

INVALID/EXPIRED TOKEN
  Frontend: Shows "Invalid Reset Link" page
  Backend: Returns error "Invalid or expired reset token"

PASSWORD VALIDATION FAILS
  Frontend: Shows validation error before submission
  Backend: Returns validation error

PASSWORDS DON'T MATCH
  Frontend: Shows error before submission
  Backend: Returns validation error

NETWORK ERROR
  Frontend: Shows error message
  User can retry

┌─────────────────────────────────────────────────────────────────────────┐
│                      SECURITY FEATURES                                │
└─────────────────────────────────────────────────────────────────────────┘

1. TOKEN HASHING
   - Token is hashed with SHA-256 before storage
   - Raw token is never stored in database
   - Only hashed token is compared

2. TOKEN EXPIRATION
   - Tokens expire after 15 minutes
   - Expired tokens cannot be used
   - Prevents long-term token abuse

3. EMAIL ENUMERATION PREVENTION
   - Always returns success message
   - Doesn't reveal if email exists
   - Prevents user enumeration attacks

4. ONE-TIME USE
   - Token is cleared after successful reset
   - Cannot be used multiple times
   - Prevents token reuse attacks

5. SECURE STORAGE
   - resetPasswordToken is not selected by default
   - resetPasswordExpire is not selected by default
   - Prevents accidental exposure in queries

6. PASSWORD STRENGTH
    - Minimum 6 characters
    - Requires uppercase, lowercase, and number
    - Enforced on both frontend and backend

7. ADMIN CONTROL
    - Admin can initiate password reset for users
    - User controls their own password reset
    - No admin access to user passwords
    - User receives direct email link

┌─────────────────────────────────────────────────────────────────────────┐
│                      FILE MAPPING                                   │
└─────────────────────────────────────────────────────────────────────────┘

FRONTEND FILES:
  src/pages/ForgotPassword.tsx          - Forgot password form
  src/pages/ResetPassword.tsx           - Reset password form
  src/pages/Users.tsx                   - Admin dashboard (updated)
  src/services/api.ts                   - API calls
  src/App.tsx                          - Routing (/reset-password/:token)

BACKEND FILES:
  backend/src/controllers/auth.controller.ts    - Request handlers
  backend/src/services/auth.service.ts        - Business logic
  backend/src/services/email.service.ts       - Email sending
  backend/src/validators/password-reset.validator.ts - Validation
  backend/src/routes/auth.routes.ts           - Route definitions
  backend/src/models/user.model.ts            - User schema
  backend/src/types/user.types.ts             - TypeScript types
  backend/src/app/config/index.ts             - Config

┌─────────────────────────────────────────────────────────────────────────┐
│                      ENDPOINTS                                       │
└─────────────────────────────────────────────────────────────────────────┘

POST /api/auth/forgot-password
  Request: { "email": "user@example.com" }
  Response: { "success": true, "message": "..." }
  Purpose: Request password reset email

POST /api/auth/reset-password
  Request: {
    "token": "abc123...",
    "password": "NewPass123",
    "confirmPassword": "NewPass123"
  }
  Response: { "success": true, "message": "..." }
  Purpose: Reset password with token

┌─────────────────────────────────────────────────────────────────────────┐
│                      ENVIRONMENT VARIABLES                            │
└─────────────────────────────────────────────────────────────────────────┘

RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
  - Your Resend.com API key
  - Required for sending emails

EMAIL_FROM=no-reply@yourdomain.com
  - Email address to send from
  - Must be verified in Resend (or use onboarding@resend.dev)

FRONTEND_URL=http://localhost:3000
  - Frontend URL for reset links
  - Used to construct: {FRONTEND_URL}/reset-password/{token}

┌─────────────────────────────────────────────────────────────────────────┐
│                      TESTING CHECKLIST                                │
└─────────────────────────────────────────────────────────────────────────┘

✅ Request password reset with valid email
✅ Request password reset with invalid email (should still return success)
✅ Receive email with correct reset link format
✅ Click reset link and navigate to correct page
✅ Token is correctly extracted from URL
✅ Password validation works on frontend
✅ Password validation works on backend
✅ Passwords must match
✅ Invalid token shows error
✅ Expired token shows error
✅ Successful reset shows success message
✅ Can login with new password after reset
✅ Old password no longer works
✅ Token cannot be reused after successful reset

ADMIN-INITIATED FLOW:
✅ Admin can open reset password modal for any user
✅ User email is auto-selected and read-only
✅ Admin sees "What happens next?" instructions
✅ Admin can send reset link
✅ Toast notification confirms link sent
✅ Modal closes after sending
✅ User receives email independently
✅ User controls their own password reset
✅ No admin access to user passwords

┌─────────────────────────────────────────────────────────────────────────┐
│                  ADMIN DASHBOARD PASSWORD RESET FLOW                │
└─────────────────────────────────────────────────────────────────────────┘

1. ADMIN ACTION
   └─> Admin navigates to: /users
       └─> Clicks "Reset Password" button on user row

2. FRONTEND: Users.tsx
   └─> Opens "Send Password Reset Link" modal
   └─> Auto-selects user email (read-only)
   └─> Shows user name and email
   └─> Displays "What happens next?" info
   └─> Admin clicks "Send Reset Link" button

3. FRONTEND API CALL
   └─> Calls: api.forgotPassword(userEmail)
       └─> POST /api/auth/forgot-password
           Body: { "email": "user@example.com" }

4. BACKEND PROCESS
   └─> Same as steps 3-4 in main flow
       └─> Generates token, hashes it, sends email

5. USER RECEIVES EMAIL
   └─> User receives email with reset link
   └─> Clicks link to reset their own password

6. USER RESETS PASSWORD
   └─> User completes steps 5-8 from main flow
   └─> Password is successfully reset

7. ADMIN NOTIFICATION
   └─> Toast notification: "Password reset link sent"
   └─> Modal closes
   └─> Admin can continue managing users
```
