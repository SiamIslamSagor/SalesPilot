# Prod-Pros Project Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Backend Structure](#backend-structure)
4. [Frontend Structure](#frontend-structure)
5. [How the Application Works](#how-the-application-works)
6. [Vercel Serverless Deployment](#vercel-serverless-deployment)
7. [API Endpoints](#api-endpoints)
8. [Environment Configuration](#environment-configuration)
9. [Development Setup](#development-setup)

---

## Project Overview

**Prod-Pros** is a full-stack web application built for managing quotes, orders, customers, and users. It's a quote management tool designed for businesses to create and manage product quotes, convert them to orders, and handle customer relationships.

### Key Features

- User authentication (login, logout, password reset)
- User management (CRUD operations)
- Customer management
- Product catalog management
- Quote creation and management
- Order management
- Multi-language support (English, Finnish)
- Responsive design with modern UI

### Tech Stack

#### Backend

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: bcryptjs for password hashing
- **Email Service**: Resend API for password reset emails
- **Validation**: express-validator
- **CORS**: cors middleware

#### Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Data Fetching**: @tanstack/react-query
- **Routing**: react-router-dom
- **Forms**: react-hook-form with Zod validation
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Charts**: Recharts

---

## Architecture

The application follows a **monorepo structure** with separate backend and frontend directories. The architecture is based on the **Model-View-Controller (MVC)** pattern with additional layers for better separation of concerns.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Pages   │  │Contexts  │  │Services  │  │Components│       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │             │             │              │
│       └─────────────┴─────────────┴─────────────┘              │
│                            │                                    │
│                    HTTP Requests (Axios)                       │
└────────────────────────────┼───────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Express API   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐         ┌────▼────┐         ┌────▼────┐
   │Controllers│      │ Services │      │Validators│
   └────┬────┘         └────┬────┘         └────┬────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Repositories │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   MongoDB      │
                    │   (Mongoose)    │
                    └─────────────────┘
```

### Data Flow

1. **User Interaction**: User interacts with the React frontend
2. **API Call**: Frontend makes HTTP requests via Axios to the Express backend
3. **Validation**: Request data is validated using express-validator
4. **Controller**: Controller handles the request and calls appropriate service
5. **Service**: Business logic is executed in service layer
6. **Repository**: Data access operations are performed via repositories
7. **Database**: MongoDB stores/retrieves data via Mongoose
8. **Response**: Response flows back through the layers to the frontend

---

## Backend Structure

The backend is located in the `backend/` directory and follows a layered architecture pattern.

### Directory Structure

```
backend/
├── src/
│   ├── app/
│   │   └── config/
│   │       └── index.ts              # Application configuration
│   ├── controllers/                  # Request handlers
│   │   ├── auth.controller.ts        # Authentication endpoints
│   │   └── user.controller.ts        # User CRUD operations
│   ├── middlewares/                  # Express middleware
│   │   └── errorHandler.middleware.ts # Global error handling
│   ├── models/                       # Mongoose schemas
│   │   └── user.model.ts             # User schema definition
│   ├── repositories/                 # Data access layer
│   │   └── user.repository.ts        # User data operations
│   ├── routes/                       # API route definitions
│   │   ├── auth.routes.ts            # Auth endpoints
│   │   └── user.routes.ts            # User endpoints
│   ├── services/                     # Business logic layer
│   │   ├── auth.service.ts           # Authentication logic
│   │   ├── email.service.ts          # Email sending logic
│   │   └── user.service.ts           # User business logic
│   ├── types/                        # TypeScript type definitions
│   │   └── user.types.ts             # User-related types
│   ├── utils/                        # Utility functions
│   │   └── database.ts               # Database connection
│   ├── validators/                   # Request validation schemas
│   │   ├── login.validator.ts        # Login validation
│   │   ├── password-reset.validator.ts # Password reset validation
│   │   └── user.validator.ts         # User validation
│   ├── app.ts                        # Express app configuration
│   └── server.ts                     # Server entry point
├── docs/                             # API documentation
│   ├── PASSWORD_RESET_API.md         # Password reset API docs
│   ├── PASSWORD_RESET_FLOW.md        # Password reset flow docs
│   └── USER_CRUD_API.md              # User CRUD API docs
├── .env.example                      # Environment variables template
├── .gitignore
├── .prettierignore
├── .prettierrc
├── eslint.config.mjs
├── package.json
├── README.md
├── tsconfig.json
└── tsconfig.node.json
```

### Backend Components Explained

#### 1. Entry Points

**[`server.ts`](backend/src/server.ts:1)** - Server startup file

- Loads environment variables using `dotenv/config`
- Connects to MongoDB database
- Starts the Express server on configured port (default: 5000)
- Handles server startup errors

**[`app.ts`](backend/src/app.ts:1)** - Express application configuration

- Creates Express application instance
- Configures middleware (JSON parser, CORS)
- Registers API routes (`/api/users`, `/api/auth`)
- Sets up health check endpoint (`/`)
- Configures error handling middleware

#### 2. Models Layer

**[`user.model.ts`](backend/src/models/user.model.ts:1)** - User Mongoose schema

- Defines User schema with fields:
  - `name`: User's full name (2-100 characters)
  - `email`: Unique email address with validation
  - `password`: Hashed password (not selected by default)
  - `role`: User role (admin/superadmin)
  - `resetPasswordToken`: Token for password reset
  - `resetPasswordExpire`: Token expiration timestamp
  - `lastPasswordReset`: Last password reset timestamp
- Pre-save middleware: Hashes password using bcrypt before saving
- Instance method: `comparePassword()` for password verification

#### 3. Types Layer

**[`user.types.ts`](backend/src/types/user.types.ts:1)** - TypeScript type definitions

- `UserRole` enum: ADMIN, SUPERADMIN
- `IUserDocument`: Mongoose document interface
- `ICreateUserDto`: Data transfer object for user creation
- `IUserResponseDto`: Data transfer object for user responses

#### 4. Repositories Layer

**[`user.repository.ts`](backend/src/repositories/user.repository.ts:1)** - Data access operations

- `create()`: Create new user
- `findById()`: Find user by ID
- `findByEmail()`: Find user by email (includes password)
- `findAll()`: Find all users with pagination
- `update()`: Update user by ID
- `delete()`: Delete user by ID
- `existsByEmail()`: Check if email exists
- Private method `toResponseDto()`: Converts user document to response DTO

#### 5. Services Layer

**[`auth.service.ts`](backend/src/services/auth.service.ts:1)** - Authentication business logic

- `login()`: Authenticate user with email and password
- `forgotPassword()`: Generate and send password reset token
- `resetPassword()`: Reset password using token

**[`email.service.ts`](backend/src/services/email.service.ts:1)** - Email sending logic

- Uses Resend API for sending emails
- `sendPasswordResetEmail()`: Sends password reset email to user

**[`user.service.ts`](backend/src/services/user.service.ts:1)** - User management logic

- Wraps repository methods with additional business logic
- Handles user creation, updates, and deletion

#### 6. Controllers Layer

**[`auth.controller.ts`](backend/src/controllers/auth.controller.ts:1)** - Authentication request handlers

- `login()`: Handles login requests
- `forgotPassword()`: Handles forgot password requests
- `resetPassword()`: Handles password reset requests

**[`user.controller.ts`](backend/src/controllers/user.controller.ts:1)** - User CRUD request handlers

- `getAllUsers()`: Get all users with pagination
- `getUserById()`: Get user by ID
- `createUser()`: Create new user
- `updateUser()`: Update user by ID
- `deleteUser()`: Delete user by ID

#### 7. Routes Layer

**[`auth.routes.ts`](backend/src/routes/auth.routes.ts:1)** - Authentication routes

- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

**[`user.routes.ts`](backend/src/routes/user.routes.ts:1)** - User management routes

- `GET /api/users` - Get all users (with pagination)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

#### 8. Validators Layer

**[`login.validator.ts`](backend/src/validators/login.validator.ts:1)** - Login request validation

- Validates email and password fields

**[`password-reset.validator.ts`](backend/src/validators/password-reset.validator.ts:1)** - Password reset validation

- Validates email for forgot password
- Validates token, password, and confirmPassword for reset

**[`user.validator.ts`](backend/src/validators/user.validator.ts:1)** - User CRUD validation

- Validates name, email, password, and role fields

#### 9. Middlewares Layer

**[`errorHandler.middleware.ts`](backend/src/middlewares/errorHandler.middleware.ts:1)** - Error handling

- `notFoundHandler()`: Handles 404 errors
- `errorHandler()`: Global error handler for all errors

#### 10. Utils Layer

**[`database.ts`](backend/src/utils/database.ts:1)** - Database utilities

- `connectDatabase()`: Connects to MongoDB
- `disconnectDatabase()`: Disconnects from MongoDB

---

## Frontend Structure

The frontend is located in the `src/` directory and follows a component-based architecture with React.

### Directory Structure

```
src/
├── assets/                          # Static assets
│   └── products/                    # Product images
│       ├── backpack.jpg
│       ├── bag-tote.jpg
│       ├── beanie.jpg
│       ├── cap-snapback.jpg
│       ├── index.ts
│       ├── mug-ceramic.jpg
│       ├── notebook.jpg
│       ├── pen-ballpoint.jpg
│       ├── pen-executive.jpg
│       ├── thermos.jpg
│       ├── tshirt-classic.jpg
│       ├── tshirt-oversized.jpg
│       └── tshirt-performance.jpg
├── components/                      # Reusable components
│   ├── ui/                          # shadcn/ui components
│   │   ├── accordion.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── alert.tsx
│   │   ├── aspect-ratio.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── button.tsx
│   │   ├── calendar.tsx
│   │   ├── card.tsx
│   │   ├── carousel.tsx
│   │   ├── chart.tsx
│   │   ├── checkbox.tsx
│   │   ├── collapsible.tsx
│   │   ├── command.tsx
│   │   ├── context-menu.tsx
│   │   ├── dialog.tsx
│   │   ├── drawer.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   ├── hover-card.tsx
│   │   ├── input-otp.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── menubar.tsx
│   │   ├── navigation-menu.tsx
│   │   ├── pagination.tsx
│   │   ├── popover.tsx
│   │   ├── progress.tsx
│   │   ├── radio-group.tsx
│   │   ├── resizable.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── sidebar.tsx
│   │   ├── skeleton.tsx
│   │   ├── slider.tsx
│   │   ├── sonner.tsx
│   │   ├── switch.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   ├── toggle-group.tsx
│   │   ├── toggle.tsx
│   │   ├── tooltip.tsx
│   │   └── use-toast.ts
│   ├── AppLayout.tsx               # Main app layout with sidebar
│   ├── NavLink.tsx                  # Navigation link component
│   ├── Pagination.tsx               # Pagination component
│   ├── ProductDetailDialog.tsx      # Product detail dialog
│   ├── ProductPickerDialog.tsx      # Product picker dialog
│   ├── ProtectedRoute.tsx          # Route protection wrapper
│   └── SortableHeader.tsx           # Sortable table header
├── contexts/                        # React Context providers
│   └── AuthContext.tsx              # Authentication context
├── data/                            # Mock data
│   └── mockData.ts                  # Sample data for development
├── hooks/                           # Custom React hooks
│   ├── use-mobile.tsx               # Mobile detection hook
│   ├── use-toast.ts                 # Toast notification hook
│   └── useSortable.ts               # Sorting functionality hook
├── i18n/                            # Internationalization
│   ├── LanguageContext.tsx          # Language context provider
│   └── translations.ts               # Translation strings
├── lib/                             # Utility libraries
│   └── utils.ts                     # Helper functions
├── pages/                           # Page components
│   ├── CustomerDetail.tsx           # Customer detail page
│   ├── Customers.tsx                # Customers list page
│   ├── Dashboard.tsx                # Dashboard page
│   ├── ForgotPassword.tsx           # Forgot password page
│   ├── Login.tsx                    # Login page
│   ├── NewQuote.tsx                 # Create new quote page
│   ├── NotFound.tsx                 # 404 page
│   ├── OfferView.tsx                # Offer view page
│   ├── OrderConfirmation.tsx       # Order confirmation page
│   ├── OrderCreate.tsx              # Create order page
│   ├── Orders.tsx                   # Orders list page
│   ├── PrintingSheet.tsx             # Printing sheet page
│   ├── Products.tsx                 # Products list page
│   ├── QuoteDetail.tsx              # Quote detail page
│   ├── Quotes.tsx                   # Quotes list page
│   ├── ResetPassword.tsx            # Reset password page
│   ├── UserCreate.tsx               # Create user page
│   └── Users.tsx                    # Users list page
├── services/                        # API services
│   └── api.ts                       # API client with Axios
├── test/                            # Test files
│   ├── example.test.ts              # Example test
│   └── setup.ts                     # Test setup
├── App.css                          # Global styles
├── App.tsx                          # Main app component with routes
├── index.css                        # Tailwind CSS imports
├── main.tsx                         # Application entry point
└── vite-env.d.ts                    # Vite type definitions
```

### Frontend Components Explained

#### 1. Entry Points

**[`main.tsx`](src/main.tsx:1)** - Application entry point

- Imports React root creation
- Imports main App component
- Imports global CSS
- Renders App to the DOM root element

**[`App.tsx`](src/App.tsx:1)** - Main application component

- Wraps app with providers:
  - `LanguageProvider`: Multi-language support
  - `QueryClientProvider`: React Query for data fetching
  - `TooltipProvider`: Tooltip support
  - `AuthProvider`: Authentication state
  - `BrowserRouter`: Client-side routing
- Defines all application routes
- Sets up toast notifications (Toaster and Sonner)

#### 2. Context Providers

**[`AuthContext.tsx`](src/contexts/AuthContext.tsx:1)** - Authentication context

- Manages user authentication state
- Provides:
  - `user`: Current logged-in user
  - `users`: List of all users
  - `login()`: Login function
  - `logout()`: Logout function
  - `addUser()`: Add new user
  - `updateUser()`: Update user
  - `removeUser()`: Remove user
  - `isSuperAdmin`: Super admin status check
- Persists user data to localStorage

**[`LanguageContext.tsx`](src/i18n/LanguageContext.tsx:1)** - Language context

- Manages application language state
- Provides language switching functionality
- Supports English (en) and Finnish (fi)

#### 3. Layout Components

**[`AppLayout.tsx`](src/components/AppLayout.tsx:1)** - Main app layout

- Collapsible sidebar navigation
- Navigation items:
  - Dashboard
  - Customers
  - Products
  - Offers (Quotes)
  - Orders
  - Users
- Language switcher dropdown
- User info display
- Logout button
- Responsive design

**[`ProtectedRoute.tsx`](src/components/ProtectedRoute.tsx:1)** - Route protection

- Checks if user is authenticated
- Redirects to login if not authenticated

#### 4. Page Components

**[`Login.tsx`](src/pages/Login.tsx:1)** - Login page

- Email and password form
- Uses AuthContext for login
- Redirects to dashboard on success

**[`ForgotPassword.tsx`](src/pages/ForgotPassword.tsx:1)** - Forgot password page

- Email input form
- Sends password reset email

**[`ResetPassword.tsx`](src/pages/ResetPassword.tsx:1)** - Reset password page

- Password and confirm password form
- Uses token from URL

**[`Dashboard.tsx`](src/pages/Dashboard.tsx:1)** - Dashboard page

- Overview statistics
- Recent activity display

**[`Users.tsx`](src/pages/Users.tsx:1)** - Users list page

- Paginated users table
- Search and filter functionality
- Role filtering
- User actions (edit, delete)

**[`UserCreate.tsx`](src/pages/UserCreate.tsx:1)** - Create user page

- User creation form
- Validation for name, email, password, role

**[`Customers.tsx`](src/pages/Customers.tsx:1)** - Customers list page

- Customer table with pagination
- Search functionality

**[`CustomerDetail.tsx`](src/pages/CustomerDetail.tsx:1)** - Customer detail page

- Customer information display
- Related quotes and orders

**[`Products.tsx`](src/pages/Products.tsx:1)** - Products list page

- Product catalog display
- Product images

**[`Quotes.tsx`](src/pages/Quotes.tsx:1)** - Quotes list page

- Quote management
- Status tracking

**[`QuoteDetail.tsx`](src/pages/QuoteDetail.tsx:1)** - Quote detail page

- Quote information
- Line items display

**[`NewQuote.tsx`](src/pages/NewQuote.tsx:1)** - Create quote page

- Quote creation form
- Product selection
- Customer selection

**[`Orders.tsx`](src/pages/Orders.tsx:1)** - Orders list page

- Order management
- Order status tracking

**[`OrderCreate.tsx`](src/pages/OrderCreate.tsx:1)** - Create order page

- Order creation from quote
- Order confirmation

**[`OrderConfirmation.tsx`](src/pages/OrderConfirmation.tsx:1)** - Order confirmation page

- Order summary display

**[`PrintingSheet.tsx`](src/pages/PrintingSheet.tsx:1)** - Printing sheet page

- Print layout for orders

**[`OfferView.tsx`](src/pages/OfferView.tsx:1)** - Offer view page

- Offer/quote display

#### 5. Service Layer

**[`api.ts`](src/services/api.ts:1)** - API service

- Axios instance with base URL configuration
- Request/response interceptors
- API methods:
  - `login()`: User authentication
  - `fetchUsers()`: Get users with pagination
  - `resetPassword()`: Admin password reset
  - `forgotPassword()`: Request password reset
  - `resetPasswordWithToken()`: Reset with token

#### 6. UI Components (shadcn/ui)

The `components/ui/` directory contains reusable UI components built with Radix UI primitives and styled with Tailwind CSS. These include:

- Form components (input, select, checkbox, etc.)
- Layout components (card, dialog, sheet, etc.)
- Feedback components (toast, alert, etc.)
- Navigation components (breadcrumb, tabs, etc.)
- Data display components (table, badge, etc.)

#### 7. Hooks

**[`use-mobile.tsx`](src/hooks/use-mobile.tsx:1)** - Mobile detection hook

- Detects if screen is mobile size

**[`use-toast.ts`](src/hooks/use-toast.ts:1)** - Toast notification hook

- Manages toast notifications

**[`useSortable.ts`](src/hooks/useSortable.ts:1)** - Sorting hook

- Provides sorting functionality for tables

#### 8. Internationalization

**[`translations.ts`](src/i18n/translations.ts:1)** - Translation strings

- Contains translations for English and Finnish
- Covers navigation, buttons, forms, messages, etc.

---

## How the Application Works

### 1. Authentication Flow

#### Login Flow

```
User enters credentials
    ↓
Frontend validates input
    ↓
API call to POST /api/auth/login
    ↓
Backend validates request
    ↓
AuthService.login() finds user by email
    ↓
Compares password using bcrypt
    ↓
Returns user data (without password)
    ↓
Frontend stores user in AuthContext
    ↓
Redirects to dashboard
```

#### Password Reset Flow

```
User clicks "Forgot Password"
    ↓
Enters email address
    ↓
API call to POST /api/auth/forgot-password
    ↓
Backend generates reset token (crypto)
    ↓
Hashes token and stores in user document
    ↓
EmailService sends reset email with token
    ↓
User clicks email link
    ↓
Frontend navigates to /reset-password/:token
    ↓
User enters new password
    ↓
API call to POST /api/auth/reset-password
    ↓
Backend validates token and expiration
    ↓
Updates user password
    ↓
Clears reset token
    ↓
User can login with new password
```

### 2. User Management Flow

#### Create User Flow

```
Admin navigates to /users/new
    ↓
Fills user creation form
    ↓
Frontend validates input
    ↓
API call to POST /api/users
    ↓
Backend validates request
    ↓
UserRepository.create() creates user
    ↓
Password hashed before save
    ↓
Returns created user
    ↓
Frontend updates user list
```

#### List Users Flow

```
Admin navigates to /users
    ↓
API call to GET /api/users?page=1&limit=10
    ↓
Backend validates request
    ↓
UserRepository.findAll() with pagination
    ↓
Returns users + pagination metadata
    ↓
Frontend displays paginated table
```

### 3. Data Flow Between Frontend and Backend

```
┌──────────────────────────────────────────────────────────────┐
│                        Frontend                               │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐ │
│  │   Page       │─────▶│   Context    │─────▶│   Service    │ │
│  │  Component   │      │  (Auth/Lang) │      │   (API)      │ │
│  └──────────────┘      └──────────────┘      └──────┬───────┘ │
│                                                          │      │
└──────────────────────────────────────────────────────────┼──────┘
                                                           │
                                                           ▼
┌──────────────────────────────────────────────────────────────┐
│                        Backend                               │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐ │
│  │  Controller  │◀─────│   Validator  │◀─────│   Express    │ │
│  └──────┬───────┘      └──────────────┘      └──────────────┘ │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐      ┌──────────────┐                        │
│  │   Service    │─────▶│ Email Service│                        │
│  └──────┬───────┘      └──────────────┘                        │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                                │
│  │ Repository   │                                                │
│  └──────┬───────┘                                                │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                                │
│  │  MongoDB     │                                                │
│  └──────────────┘                                                │
└───────────────────────────────────────────────────────────────┘
```

### 4. Request Lifecycle

1. **User Action**: User interacts with UI (clicks button, submits form)
2. **Event Handler**: Page component handles the event
3. **State Update**: Component may update local state
4. **API Call**: Service layer makes HTTP request via Axios
5. **Request Interceptor**: Axios adds headers (Content-Type, etc.)
6. **Backend Receive**: Express receives request
7. **Route Matching**: Router matches request to controller
8. **Validation**: Validator checks request data
9. **Controller**: Controller calls service method
10. **Service**: Service executes business logic
11. **Repository**: Repository performs database operation
12. **Database**: MongoDB executes query
13. **Response**: Data flows back through layers
14. **Response Interceptor**: Axios processes response
15. **State Update**: Frontend updates context/state
16. **UI Update**: Component re-renders with new data

---

## Vercel Serverless Deployment

The backend has been adapted to work with Vercel's serverless functions while maintaining full compatibility with local development. This section explains the implementation, changes made, and how the logic works on Vercel.

### Overview of Serverless Architecture

#### Traditional Server vs Serverless

**Traditional Server (Local Development)**:

```
Start Server → Connect DB Once → Listen on Port → Handle Requests → Keep Running
```

- Long-running process that stays alive indefinitely
- Single database connection established at startup
- Server listens on a specific port (e.g., 5000)
- Suitable for traditional hosting platforms (Railway, Render, Heroku)

**Vercel Serverless Functions**:

```
Request Arrives → Start Function → Connect/Reuse DB → Handle Request → Return Response → Shutdown
```

- Functions start on each HTTP request and shut down after
- No persistent server or port listening
- Functions have execution time limits (10-60 seconds)
- Automatic scaling based on traffic
- Pay-per-use pricing model

### Changes Made for Vercel Compatibility

#### 1. Database Connection with Connection Pooling ([`backend/src/utils/database.ts`](backend/src/utils/database.ts:1))

**Previous Implementation** (Traditional):

```typescript
const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.DATABASE_URL;
    if (!mongoUri) {
      throw new Error("DATABASE_URL environment variable is not defined");
    }
    const options = { autoIndex: true };
    await mongoose.connect(mongoUri, options);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1); // ❌ Not compatible with serverless
  }
};
```

**New Implementation** (Serverless-Optimized):

```typescript
let cachedConnection: typeof mongoose | null = null;

const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.DATABASE_URL;
    if (!mongoUri) {
      throw new Error("DATABASE_URL environment variable is not defined");
    }

    // Reuse existing connection if available (serverless optimization)
    if (cachedConnection && mongoose.connection.readyState === 1) {
      console.log("🔄 Using cached MongoDB connection");
      return;
    }

    const options = {
      autoIndex: true,
      maxPoolSize: 10, // Connection pooling for serverless
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(mongoUri, options);
    cachedConnection = mongoose;
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error; // ✅ Throw instead of process.exit for serverless
  }
};
```

**Key Changes**:

- **Connection Caching**: Added `cachedConnection` variable to store and reuse MongoDB connections across function invocations
- **Connection Pooling**: Set `maxPoolSize: 10` to allow multiple connections to be reused
- **Error Handling**: Replaced `process.exit(1)` with `throw error` to avoid crashing serverless functions
- **Connection State Check**: Added check for `mongoose.connection.readyState === 1` to verify connection is active

#### 2. Vercel Entry Point ([`backend/api/index.ts`](backend/api/index.ts:1))

Created a new Vercel serverless handler:

```typescript
import { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../src/app";
import { connectDatabase } from "../src/utils/database";

// Vercel serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Connect to database before handling request
    await connectDatabase();

    // Handle the request with Express app
    return app(req, res);
  } catch (error) {
    console.error("Error in Vercel handler:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
```

**How It Works**:

1. Vercel receives an HTTP request
2. The `handler` function is invoked
3. Database connection is established (or reused if cached)
4. The Express app processes the request
5. Response is returned to the client
6. Function instance is recycled by Vercel

#### 3. Configuration Files

**[`backend/vercel.json`](backend/vercel.json:1)** - Vercel Build Configuration:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/api/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

**Explanation**:

- `builds`: Specifies that all `.ts` files in `api/` directory should be built using `@vercel/node`
- `routes`: Routes all requests to the `api/index.ts` handler
- `env`: Sets `NODE_ENV` to `production` by default

**[`backend/package.json`](backend/package.json:6)** - Updated Scripts:

```json
{
  "scripts": {
    "start:prod": "node ./dist/server.js",
    "start:dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "vercel-build": "tsc", // ✅ Added for Vercel
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier . --write",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

**[`backend/tsconfig.json`](backend/tsconfig.json:2)** - Updated Include Paths:

```json
{
  "include": ["src/**/*.ts", "api/**/*.ts"], // ✅ Added api/**/*.ts
  "exclude": ["node_modules"],
  "compilerOptions": {
    // ... other options
    "outDir": "./dist"
  }
}
```

**Note**: Removed `rootDir: "./src"` to allow compilation of both `src` and `api` directories.

#### 4. Dependencies

Added `@vercel/node` package:

```bash
npm install @vercel/node
```

This package provides:

- TypeScript types for `VercelRequest` and `VercelResponse`
- Vercel-specific utilities and helpers
- Serverless function runtime support

### How the Logic Works on Vercel

#### Request Flow on Vercel

```
┌─────────────────────────────────────────────────────────────────┐
│                     Vercel Edge Network                         │
│                    (Global CDN & Load Balancer)                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Vercel Serverless Function                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  1. Function Starts (Cold Start or Warm Start)          │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │  2. Handler Invoked                            │   │    │
│  │  │  ┌─────────────────────────────────────────┐     │   │    │
│  │  │  │  3. connectDatabase() Called           │     │   │    │
│  │  │  │  ┌─────────────────────────────────┐    │     │   │    │
│  │  │  │  │  Check cachedConnection?      │    │     │   │    │
│  │  │  │  │  ┌────────────────────────┐     │    │     │   │    │
│  │  │  │  │  │  Yes → Reuse connection│     │    │     │   │    │
│  │  │  │  │  │  No  → New connection   │     │    │     │   │    │
│  │  │  │  │  └────────────────────────┘     │    │     │   │    │
│  │  │  │  │  Connection Pool (max: 10)      │    │     │   │    │
│  │  │  │  └─────────────────────────────────┘    │     │   │    │
│  │  │  └─────────────────────────────────────────┘     │   │    │
│  │  │  4. Express App Handles Request                │   │    │
│  │  │     → Routes → Controllers → Services → DB      │   │    │
│  │  │  5. Response Sent to Client                    │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  │  6. Function Stops (or stays warm for reuse)         │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

#### Connection Pooling in Serverless

**Why Connection Pooling Matters**:

Without connection pooling:

```
Request 1 → Connect to DB → Process → Disconnect → ~200ms overhead
Request 2 → Connect to DB → Process → Disconnect → ~200ms overhead
Request 3 → Connect to DB → Process → Disconnect → ~200ms overhead
Total: 600ms connection overhead
```

With connection pooling:

```
Request 1 → Connect to DB (pool) → Process → Keep connection alive
Request 2 → Reuse connection → Process → Keep connection alive
Request 3 → Reuse connection → Process → Keep connection alive
Total: ~200ms connection overhead (first request only)
```

**How It Works**:

1. **First Request**: Establishes new MongoDB connection and adds to pool
2. **Subsequent Requests**: Reuse existing connection from pool
3. **Connection Reuse**: Vercel keeps function instances "warm" for a short period, allowing connection reuse
4. **Pool Size**: `maxPoolSize: 10` allows up to 10 concurrent connections

#### Cold Starts vs Warm Starts

**Cold Start** (First request or after inactivity):

```
Function starts → Load code → Connect to DB → Process request → ~500-1000ms
```

**Warm Start** (Subsequent requests within warm period):

```
Function starts (already loaded) → Reuse DB connection → Process request → ~50-100ms
```

Vercel automatically keeps function instances warm for a short period (typically 5-15 minutes) after the last request.

### Local Development vs Vercel Deployment

| Feature                   | Local Development                      | Vercel Serverless                        |
| ------------------------- | -------------------------------------- | ---------------------------------------- |
| **Server Lifecycle**      | Long-running process                   | Per-request functions                    |
| **Database Connection**   | Once at startup                        | Per-request with pooling                 |
| **Entry Point**           | [`server.ts`](backend/src/server.ts:1) | [`api/index.ts`](backend/api/index.ts:1) |
| **Port**                  | Listens on port 5000                   | No port (handled by Vercel)              |
| **Execution Time**        | Unlimited                              | 10-60 seconds                            |
| **Environment Variables** | `.env` file                            | Vercel dashboard                         |
| **Logs**                  | Console output                         | Vercel dashboard                         |
| **Scaling**               | Manual/vertical                        | Automatic/horizontal                     |
| **Cost**                  | Server cost                            | Pay-per-use                              |
| **Connection Caching**    | Not needed (single connection)         | Essential for performance                |

### Deployment Steps

#### 1. Prepare Your Code

Ensure all changes are committed to Git:

```bash
git add .
git commit -m "Add Vercel serverless support"
git push
```

#### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Select the `backend` folder as the root directory
5. Click "Deploy"

#### 3. Configure Environment Variables

In Vercel dashboard, go to **Settings → Environment Variables** and add:

```
DATABASE_URL=mongodb+srv://your-username:your-password@cluster.mongodb.net/your-database
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com
```

**Important**: Copy all environment variables from your local `.env` file.

#### 4. Redeploy

After adding environment variables:

- Go to **Deployments** tab
- Click the three dots next to your latest deployment
- Select **Redeploy**

#### 5. Test Your Deployment

```bash
# Health check
curl https://your-project.vercel.app/

# Test user registration
curl -X POST https://your-project.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","role":"admin"}'
```

### Troubleshooting

#### Build Errors

**Error: Cannot find module '@vercel/node'**

```bash
cd backend
npm install @vercel/node
```

#### Runtime Errors

**Error: DATABASE_URL not defined**

- Ensure `DATABASE_URL` is added in Vercel environment variables
- Redeploy after adding environment variables

**Error: Connection timeout**

- Verify your MongoDB connection string is correct
- Ensure your MongoDB cluster allows connections from anywhere (whitelist IP `0.0.0.0/0`)
- Check connection timeout settings in [`database.ts`](backend/src/utils/database.ts:22)

**Slow response times**

- First requests may be slower due to cold starts (expected behavior)
- Connection pooling helps reduce subsequent request times
- Consider using Vercel's Edge Functions for better performance

#### Monitoring

View logs and metrics in Vercel dashboard:

- **Logs**: Real-time function logs
- **Analytics**: Request counts, response times, error rates
- **Functions**: Function execution times and memory usage

### Best Practices for Serverless

1. **Keep Functions Lightweight**: Minimize cold start time by reducing dependencies and initialization code
2. **Use Connection Pooling**: Already implemented for MongoDB
3. **Handle Timeouts**: Set appropriate timeout values for database operations
4. **Monitor Cold Starts**: Track first-request latency
5. **Optimize Dependencies**: Remove unused dependencies to reduce bundle size
6. **Error Handling**: Implement proper error handling to avoid function crashes
7. **Environment Variables**: Use Vercel's environment variable management
8. **Logging**: Use structured logging for better debugging in Vercel dashboard

### Summary

The backend now supports both traditional server deployment (local development, Railway, Render, Heroku) and Vercel serverless deployment with:

✅ **Serverless-compatible architecture** with [`api/index.ts`](backend/api/index.ts:1) entry point
✅ **Connection pooling** for optimal performance in serverless environments
✅ **Full local development support** with [`server.ts`](backend/src/server.ts:1) entry point
✅ **Production-ready configuration** with [`vercel.json`](backend/vercel.json:1)
✅ **Comprehensive error handling** for serverless environments
✅ **TypeScript support** with proper configuration

For detailed deployment instructions, see [`backend/VERCEL_DEPLOYMENT.md`](backend/VERCEL_DEPLOYMENT.md:1).

---

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/login

Login with email and password

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "_id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

**Response (Error):**

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

#### POST /api/auth/forgot-password

Request password reset email

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

#### POST /api/auth/reset-password

Reset password with token

**Request Body:**

```json
{
  "token": "reset_token_here",
  "password": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

### User Management Endpoints

#### GET /api/users

Get all users with pagination

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `role` (optional): Filter by role (admin/superadmin)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "admin",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "pages": 1,
    "limit": 10
  }
}
```

#### GET /api/users/:id

Get user by ID

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "admin",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/users

Create new user

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "admin"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### PUT /api/users/:id

Update user

**Request Body:**

```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "superadmin"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "_id": "user_id",
    "name": "Updated Name",
    "email": "updated@example.com",
    "role": "superadmin",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-02T00:00:00.000Z"
  }
}
```

#### DELETE /api/users/:id

Delete user

**Response:**

```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "_id": "user_id",
    "name": "Deleted User",
    "email": "deleted@example.com",
    "role": "admin",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## Environment Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory based on `.env.example`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=mongodb://localhost:27017/prod-pros

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:8080

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=noreply@yourdomain.com
```

### Frontend Environment Variables

Create a `.env` file in the root directory:

```env
# API Base URL
VITE_API_URL=http://localhost:5000/api
```

---

## Development Setup

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or bun package manager

### Backend Setup

1. Navigate to backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file:

```bash
cp .env.example .env
```

4. Edit `.env` with your configuration:

```env
PORT=5000
DATABASE_URL=mongodb://localhost:27017/prod-pros
FRONTEND_URL=http://localhost:8080
RESEND_API_KEY=your_api_key
FROM_EMAIL=noreply@yourdomain.com
```

5. Start development server:

```bash
npm run start:dev
```

The backend server will start on `http://localhost:5000`

### Frontend Setup

1. Navigate to root directory:

```bash
cd ..
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file:

```bash
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

4. Start development server:

```bash
npm run dev
```

The frontend will start on `http://localhost:8080`

### Build for Production

#### Backend

```bash
cd backend
npm run build
npm run start:prod
```

#### Frontend

```bash
npm run build
npm run preview
```

### Running Tests

#### Frontend Tests

```bash
npm run test
```

#### Watch Mode

```bash
npm run test:watch
```

---

## Project Summary

### Backend Technologies

- **Express.js**: Web framework for building REST APIs
- **TypeScript**: Type-safe JavaScript
- **MongoDB**: NoSQL database for data storage
- **Mongoose**: ODM for MongoDB interaction
- **bcryptjs**: Password hashing
- **express-validator**: Request validation
- **Resend**: Email service API
- **cors**: Cross-origin resource sharing

### Frontend Technologies

- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library built on Radix UI
- **React Router**: Client-side routing
- **React Query**: Data fetching and caching
- **Axios**: HTTP client
- **React Hook Form**: Form management
- **Zod**: Schema validation
- **Lucide React**: Icon library
- **Recharts**: Charting library

### Key Features

1. **Authentication**: Secure login with bcrypt password hashing
2. **Password Reset**: Email-based password reset with token validation
3. **User Management**: Full CRUD operations for users
4. **Multi-language**: English and Finnish language support
5. **Responsive Design**: Mobile-friendly UI
6. **Modern UI**: Clean interface with shadcn/ui components
7. **Type Safety**: Full TypeScript coverage
8. **API Documentation**: Comprehensive API docs in backend/docs/

### Architecture Patterns

- **Backend**: Layered architecture (Controller → Service → Repository → Model)
- **Frontend**: Component-based architecture with Context API for state management
- **API**: RESTful API design
- **Database**: MongoDB with Mongoose ODM
- **Styling**: Utility-first CSS with Tailwind

---

## File Reference

### Backend Key Files

| File                                                                                           | Purpose                   |
| ---------------------------------------------------------------------------------------------- | ------------------------- |
| [`backend/src/server.ts`](backend/src/server.ts:1)                                             | Server entry point        |
| [`backend/src/app.ts`](backend/src/app.ts:1)                                                   | Express app configuration |
| [`backend/src/models/user.model.ts`](backend/src/models/user.model.ts:1)                       | User schema               |
| [`backend/src/repositories/user.repository.ts`](backend/src/repositories/user.repository.ts:1) | User data access          |
| [`backend/src/services/auth.service.ts`](backend/src/services/auth.service.ts:1)               | Auth business logic       |
| [`backend/src/controllers/auth.controller.ts`](backend/src/controllers/auth.controller.ts:1)   | Auth endpoints            |
| [`backend/src/routes/auth.routes.ts`](backend/src/routes/auth.routes.ts:1)                     | Auth routes               |
| [`backend/src/utils/database.ts`](backend/src/utils/database.ts:1)                             | Database connection       |

### Frontend Key Files

| File                                                             | Purpose                 |
| ---------------------------------------------------------------- | ----------------------- |
| [`src/main.tsx`](src/main.tsx:1)                                 | Application entry point |
| [`src/App.tsx`](src/App.tsx:1)                                   | Main app with routes    |
| [`src/contexts/AuthContext.tsx`](src/contexts/AuthContext.tsx:1) | Authentication state    |
| [`src/services/api.ts`](src/services/api.ts:1)                   | API client              |
| [`src/components/AppLayout.tsx`](src/components/AppLayout.tsx:1) | Main layout             |
| [`src/pages/Login.tsx`](src/pages/Login.tsx:1)                   | Login page              |
| [`src/pages/Users.tsx`](src/pages/Users.tsx:1)                   | Users list              |
| [`src/i18n/translations.ts`](src/i18n/translations.ts:1)         | Translations            |

---

_Last Updated: 2026-03-03_
