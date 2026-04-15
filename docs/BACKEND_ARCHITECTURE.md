# Backend Architecture Documentation

## Overview

The backend is a **Node.js + Express + TypeScript** REST API with a **layered architecture** (Routes → Validators → Controllers → Services → Repositories → Models). It connects to **MongoDB** via Mongoose and deploys as a **Vercel serverless function**.

---

## Directory Structure

```
backend/
├── api/
│   └── index.ts              # Vercel serverless entry point
├── src/
│   ├── app.ts                # Express app configuration
│   ├── server.ts             # Server startup + DB connection
│   ├── controllers/          # HTTP request handlers (11 controllers)
│   ├── services/             # Business logic layer (14 services)
│   ├── repositories/         # Data access layer (8 repositories)
│   ├── models/               # Mongoose schemas (9 models)
│   ├── routes/               # API route definitions (11 route files)
│   ├── validators/           # Request validation rules (6 validator files)
│   ├── middlewares/           # Auth, authorization, error handling, file upload
│   ├── migrations/           # Data migration scripts
│   ├── scripts/              # One-off utility scripts
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Shared utilities
├── docs/                     # API-specific docs
├── package.json
├── tsconfig.json
└── vercel.json               # Serverless deployment config
```

---

## Data Models

### User

| Field               | Type   | Notes                                               |
| ------------------- | ------ | --------------------------------------------------- |
| name                | String | 2-100 chars, required                               |
| email               | String | Unique, lowercase, required                         |
| password            | String | Min 6 chars, bcrypt hashed, not selected by default |
| role                | Enum   | `admin` \| `superadmin`                             |
| resetPasswordToken  | String | SHA-256 hashed reset token                          |
| resetPasswordExpire | Date   | 15-minute token expiry                              |
| lastPasswordReset   | Date   | Timestamp of last reset                             |

**Hooks:** Pre-save hashes password if modified (bcrypt, salt=10)
**Methods:** `comparePassword(candidate)` → `Promise<boolean>`

---

### Customer

| Field           | Type   | Notes                                               |
| --------------- | ------ | --------------------------------------------------- |
| companyName     | String | 2-200 chars, unique, required                       |
| businessId      | String | Finnish format XXXXXXX-X, unique, required          |
| contactPerson   | String | 2-100 chars, required                               |
| phone           | String | Required                                            |
| email           | String | Lowercase, required                                 |
| address         | String | Max 500 chars, required                             |
| city            | String | 2-100 chars, required                               |
| postcode        | String | 2-20 chars, required                                |
| notes           | String | Max 5000 chars                                      |
| companyLogo     | String | ImgBB URL                                           |
| type            | Enum   | `prospect` \| `active` \| `vip` (default: prospect) |
| totalSales      | Number | Cumulative sales amount                             |
| totalMargin     | Number | Cumulative margin amount                            |
| discountPercent | Number | 0-100, customer discount                            |

**Indexes:** Text index on companyName + email

---

### Product

| Field           | Type     | Notes                                  |
| --------------- | -------- | -------------------------------------- |
| productNumber   | String   | Unique, required                       |
| name            | String   | Required                               |
| brand           | String   | Default: "Unknown"                     |
| category        | String   | Default: "Uncategorized"               |
| gender          | String   | Default: "Unisex"                      |
| description     | String   | Optional                               |
| fabrics         | String   | Optional                               |
| purchasePrice   | Number   | Min 0, default 0                       |
| salesPrice      | Number   | Min 0, default 0                       |
| margin          | Number   | Auto-calculated                        |
| useCustomMargin | Boolean  | Default: false                         |
| status          | Enum     | `active` \| `inactive`                 |
| images          | [String] | Array of image URLs                    |
| countryOfOrigin | String   | Optional                               |
| variants        | Array    | `[{ size, color, colorCode, price? }]` |

**Hooks:** Pre-save calculates `margin = ((salesPrice - purchasePrice) / salesPrice) × 100`
**Indexes:** productNumber (unique), text(name, description), category, brand, gender, status

---

### Offer

| Field            | Type   | Notes                                                                     |
| ---------------- | ------ | ------------------------------------------------------------------------- |
| offerNumber      | String | Auto-generated O-XXX, unique                                              |
| accessCode       | String | 64-char hex, auto-generated, unique                                       |
| ownerUserId      | String | Creating user's ID                                                        |
| ownerUserName    | String | Denormalized                                                              |
| ownerUserEmail   | String | Denormalized, lowercase                                                   |
| customerId       | String | Required                                                                  |
| customerName     | String | Denormalized                                                              |
| contactPerson    | String | Denormalized                                                              |
| email            | String | Denormalized                                                              |
| phone            | String | Denormalized                                                              |
| address          | String | Denormalized                                                              |
| items            | Array  | See Items below                                                           |
| offerDetails     | Object | See OfferDetails below                                                    |
| totalAmount      | Number | Calculated, min 0                                                         |
| itemCount        | Number | Min 1                                                                     |
| status           | Enum   | `draft` \| `sent` \| `accepted` \| `rejected` \| `expired` \| `completed` |
| customerResponse | Enum   | `pending` \| `accepted` \| `rejected`                                     |
| customerComments | Array  | `[{ comment, timestamp }]`                                                |
| version          | Number | Incremented on resend                                                     |
| respondedAt      | Date   | When customer responded                                                   |

**Offer Item fields:** productId, productNumber, productName, quantity, unitPrice, discount (0-100%), markingCost, internalMarkingCost, showUnitPrice, showTotalPrice, hideMarkingCost, generateMockup, mockupImage

**OfferDetails fields:** validUntil, validDays, showTotalPrice, additionalTermsEnabled, additionalTerms (max 2000), specialCosts[{name, amount}]

**Hooks:** Pre-save generates unique accessCode if missing
**Indexes:** offerNumber (unique), accessCode (unique), ownerUserId+createdAt, customerId+status, ownerUserEmail+status, status+createdAt, text(offerNumber, customerName)

---

### Order

| Field                                              | Type   | Notes                                                     |
| -------------------------------------------------- | ------ | --------------------------------------------------------- |
| orderNumber                                        | String | SO-YYYY-NNN format, unique                                |
| offerId                                            | String | Source offer reference, required                          |
| offerNumber                                        | String | Denormalized                                              |
| ownerUserId                                        | String | Creating user                                             |
| ownerUserName                                      | String | Denormalized                                              |
| ownerUserEmail                                     | String | Denormalized                                              |
| customerId                                         | String | Required                                                  |
| customerName, contactPerson, email, phone, address | String | Denormalized                                              |
| items                                              | Array  | Offer items + selectedColor, selectedSize, printingMethod |
| specialCosts                                       | Array  | `[{ name, amount }]`                                      |
| appliedCostConfig                                  | Array  | `[{ name, type, category, value, calculatedAmount }]`     |
| totalAmount                                        | Number | Calculated total                                          |
| totalMargin                                        | Number | Calculated margin                                         |
| costConfigAdjustment                               | Number | Margin adjustment from cost configs                       |
| salesperson                                        | String | Optional                                                  |
| status                                             | Enum   | `pending` \| `processing` \| `completed` \| `cancelled`   |

**Indexes:** customerId, ownerUserId+createdAt, status, offerId, customerId+status

---

### PrintingSheet

| Field                                       | Type   | Notes                                    |
| ------------------------------------------- | ------ | ---------------------------------------- |
| productId, productNumber, productName       | String | Required                                 |
| productImage, mockupImage                   | String | Optional URLs                            |
| orderDate, reference, seller                | String | Required                                 |
| deliveryDate, deliveryTime                  | String | Required                                 |
| customerName, printMethod, printMethodOther | String | Required                                 |
| sizeQuantities                              | Map    | `{ "S": "50", "M": "100", ... }`         |
| workInstructions                            | String | Optional                                 |
| totalQuantity                               | Number | Auto-computed from sizeQuantities        |
| offerId                                     | String | Required                                 |
| orderId                                     | String | Optional                                 |
| groupId                                     | String | Groups related sheets for multi-page PDF |

**Hooks:** Pre-save computes totalQuantity

---

### CostConfig

| Field     | Type    | Notes                   |
| --------- | ------- | ----------------------- |
| name      | String  | Max 200 chars, required |
| type      | Enum    | `fixed` \| `percentage` |
| value     | Number  | Min 0, default 0        |
| category  | Enum    | `cost` \| `margin`      |
| enabled   | Boolean | Default: true           |
| sortOrder | Number  | Display order           |

---

### EmailTemplate

| Field          | Type    | Notes                                                                                                                                                                  |
| -------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| templateKey    | Enum    | `password_reset` \| `offer_sent` \| `order_confirmation` \| `offer_accepted_admin` \| `offer_rejected_admin` \| `offer_accepted_customer` \| `offer_rejected_customer` |
| subject        | String  | Max 500 chars                                                                                                                                                          |
| htmlBody       | String  | HTML with `{{variable}}` placeholders                                                                                                                                  |
| enabled        | Boolean | Default: true                                                                                                                                                          |
| description    | String  | Template description                                                                                                                                                   |
| recipientEmail | String  | Override recipient (for admin templates)                                                                                                                               |

---

### AppSettings (Singleton)

| Field                  | Type   | Notes                    |
| ---------------------- | ------ | ------------------------ |
| customMarginPercentage | Number | 0-100, default margin %  |
| marginMode             | Enum   | `fallback` \| `override` |

---

## Middleware Stack

### Request Pipeline

```
Incoming Request
  │
  ├── Helmet (security headers)
  ├── Compression (gzip)
  ├── CORS (whitelist: FRONTEND_URL, localhost:8080, localhost:5173)
  ├── Express JSON parser (10MB limit)
  │
  ├── Route Matching
  │     ├── Rate Limiter (auth & public routes only)
  │     ├── authenticate (JWT verification → req.user)
  │     ├── requireManager / requireSuperAdmin (role check)
  │     ├── Validators (express-validator chains)
  │     └── Controller handler
  │
  ├── errorHandler (catches all errors)
  └── notFoundHandler (404 for unmatched routes)
```

### Authentication Middleware

- Extracts JWT from `Authorization: Bearer <token>` header
- Verifies with `JWT_SECRET`, attaches `req.user = { userId, name, email, role }`
- Returns 401 on missing/invalid/expired tokens

### Authorization Middleware

- `requireManager` — Allows `admin` and `superadmin` roles
- `requireSuperAdmin` — Allows `superadmin` only
- Returns 403 on insufficient permissions

### Error Handler

- Catches Mongoose validation errors → 400
- Catches Mongoose cast errors (invalid ObjectId) → 400
- Catches duplicate key errors → 409
- Catches express-validator errors → 400
- Catches custom `AppError` → uses statusCode
- All others → 500

---

## Services Layer — Business Logic

### Key Service Behaviors

**OfferService**

- Calculates `totalAmount` from items (considering discounts, marking costs) + special costs
- Uses `Math.round(value * 100) / 100` to prevent floating-point drift
- Checks offer expiry on every access and auto-updates status
- Enriches offer items with product images from the catalog
- On resend: increments version, resets status to "sent"
- On duplicate: creates new draft with new offerNumber and accessCode

**OrderService**

- Generates SO-YYYY-NNN order numbers
- Calculates totalMargin using product margins + app settings margin mode:
  - `override` mode: always uses `customMarginPercentage` from AppSettings
  - `fallback` mode: uses `customMarginPercentage` only when product margin is 0
- Adds marking profit: `(markingCost - internalMarkingCost) × quantity`
- Applies CostConfig adjustments (fixed/percentage) to margin
- Links printing sheets from offer to order
- State machine: `pending → processing → completed/cancelled`
- Completing increments customer totals; cancelling/deleting completed orders reverses them

**MockupService**

- Fetches product image as buffer from URL
- Parses logo from base64 or data URI
- Detects image dimensions (PNG/JPEG header parsing)
- Finds closest supported aspect ratio from 10 options
- Calls Google Gemini 2.5 Flash Image via Vercel AI Gateway
- Uploads result to ImgBB
- Batch mode: parses logo once, processes up to 20 items with 3 concurrent

**EmailService**

- Loads customizable templates from DB (with factory defaults as fallback)
- Interpolates `{{variables}}` in subject and body
- Builds dynamic HTML tables for offer items and special costs
- Sends via Resend API
- Admin response templates require a configured recipientEmail

**CustomerService**

- Cascades customer info changes to denormalized fields in offers and orders
- Uploads company logos to ImgBB
- Blocks deletion if customer has any linked offers or orders

**DashboardService**

- Orchestrates 8 parallel aggregations: stats, offers, orders, customers, products, printing sheets, financial, offers-by-status
- All queries respect ownership filtering for non-superadmin users

---

## Repositories Layer — Data Access

Each repository encapsulates all MongoDB operations for its entity:

| Repository                  | Key Methods                                                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **UserRepository**          | CRUD, findByEmail (with +password), existsByEmail, toResponseDto                                                            |
| **CustomerRepository**      | CRUD, findByBusinessId, existsByBusinessId, count, incrementTotals ($inc)                                                   |
| **ProductRepository**       | CRUD, findByProductNumber, bulkUpsert, getDistinct(categories/brands/genders)                                               |
| **OfferRepository**         | CRUD, generateNextOfferNumber, findByAccessCode, findByCustomerId, bulkExpireByIds, updateManyByCustomerId, createDuplicate |
| **OrderRepository**         | CRUD, findByOrderNumber, updateManyByCustomerId                                                                             |
| **PrintingSheetRepository** | createMany, findByOfferId/OrderId, updateOrderIdByOfferId, deleteByGroupId                                                  |
| **CostConfigRepository**    | CRUD, findEnabled, bulkUpsert                                                                                               |
| **AppSettingsRepository**   | get (singleton), update                                                                                                     |

---

## Validators

All mutation endpoints use **express-validator** chains:

| Validator File                  | Validates                                                                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **offer.validator.ts**          | createOffer — customer fields, items array with pricing validation, offerDetails, cross-field: internalMarkingCost ≤ markingCost |
| **customer.validator.ts**       | createCustomer/updateCustomer — company fields, Finnish business ID format (XXXXXXX-X), phone regex, postcode format             |
| **user.validator.ts**           | createUser — name (2-100), email, password (min 6, uppercase + lowercase + digit)                                                |
| **login.validator.ts**          | login — email (valid), password (min 6)                                                                                          |
| **password-reset.validator.ts** | forgotPassword (email), resetPassword (token, password with pattern, confirmPassword match)                                      |
| **costConfig.validator.ts**     | create/update/bulkSave — name, type, value (capped 100 for %), category, enabled, sortOrder                                      |

---

## Migrations & Scripts

| File                                 | Purpose                                                                                             |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `001_backfill_offer_access_codes.ts` | Generates missing accessCode fields for existing offers                                             |
| `002_backfill_record_owners.ts`      | Resolves and populates ownerUserId/Name/Email on offers and orders by matching against User records |
| `recalculateOrderTotals.ts`          | Fixes orders with totalAmount=0 by recalculating from item data                                     |

---

## Environment Variables

| Variable             | Required | Description                           |
| -------------------- | -------- | ------------------------------------- |
| `PORT`               | No       | Server port (default: 5000)           |
| `DATABASE_URL`       | Yes      | MongoDB connection string             |
| `JWT_SECRET`         | Yes      | Secret for JWT signing                |
| `RESEND_API_KEY`     | Yes      | Resend email service API key          |
| `EMAIL_FROM`         | Yes      | Sender email address                  |
| `FRONTEND_URL`       | Yes      | Frontend URL for CORS and email links |
| `AI_GATEWAY_API_KEY` | Yes      | Vercel AI Gateway key for Gemini      |
| `IMGBB_API_KEY`      | Yes      | ImgBB image hosting API key           |
| `NODE_ENV`           | No       | Environment (development/production)  |
