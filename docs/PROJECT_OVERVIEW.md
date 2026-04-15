# Prod-Pros — Complete Project Documentation

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Core Business Features](#core-business-features)
- [User Roles & Permissions](#user-roles--permissions)
- [Business Workflow](#business-workflow)
- [Data Models](#data-models)
- [Cross-Cutting Concerns](#cross-cutting-concerns)

---

## Project Overview

**Prod-Pros** is a full-stack B2B **Quote & Order Management System** designed for businesses that sell branded/printed promotional products. It covers the entire lifecycle from customer management through quote creation, AI mockup generation, customer approval, order fulfillment, and financial reporting.

### What It Does

| Capability                | Description                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Customer CRM**          | Manage company contacts with types (Prospect → Active → VIP), logos, and cumulative sales/margin tracking     |
| **Product Catalog**       | Full product catalog with variants (size/color), pricing, margins, and bulk Excel import                      |
| **Quote Builder**         | Multi-step offer creation with product selection, pricing, discounts, marking costs, and AI-generated mockups |
| **Customer Portal**       | Public offer view where customers accept/reject quotes and leave comments — no login needed                   |
| **Order Management**      | Convert accepted quotes into sales orders with printing sheet generation and PDF export                       |
| **AI Mockups**            | Google Gemini-powered mockup images that overlay a company logo onto product photos                           |
| **Email Notifications**   | Customizable email templates for offers, order confirmations, password resets, and response alerts            |
| **Dashboard & Analytics** | Real-time KPIs, charts (revenue, margins, status breakdowns), top customers, and top products                 |
| **Financial Tracking**    | Margin calculations, cost configurations, sales reports by customer and salesperson                           |
| **Multi-Language**        | Full Finnish (fi) and English (en) UI support                                                                 |

---

## Tech Stack

### Frontend

| Technology                | Purpose                                   |
| ------------------------- | ----------------------------------------- |
| **React 18 + TypeScript** | UI framework                              |
| **Vite**                  | Build tool and dev server                 |
| **Tailwind CSS**          | Utility-first styling                     |
| **shadcn/ui (Radix UI)**  | 42+ accessible UI components              |
| **React Router v6**       | Client-side routing                       |
| **React Query**           | Server state caching                      |
| **Axios**                 | HTTP client with interceptors             |
| **Recharts**              | Dashboard chart visualizations            |
| **jsPDF + html2canvas**   | PDF generation for orders/printing sheets |
| **Lucide React**          | Icon library                              |

### Backend

| Technology               | Purpose                                |
| ------------------------ | -------------------------------------- |
| **Node.js + TypeScript** | Runtime and language                   |
| **Express.js**           | HTTP server framework                  |
| **MongoDB + Mongoose**   | Database and ODM                       |
| **JWT (jsonwebtoken)**   | Authentication tokens (7-day expiry)   |
| **bcryptjs**             | Password hashing                       |
| **Resend**               | Transactional email delivery           |
| **Vercel AI SDK**        | AI gateway for Google Gemini           |
| **Multer**               | File upload handling (Excel import)    |
| **XLSX**                 | Excel file parsing                     |
| **Helmet**               | Security headers                       |
| **express-rate-limit**   | Rate limiting on auth/public endpoints |
| **ImgBB**                | Image hosting for logos and mockups    |

### Deployment

| Platform          | Usage                                            |
| ----------------- | ------------------------------------------------ |
| **Vercel**        | Both frontend and backend (serverless functions) |
| **MongoDB Atlas** | Cloud database                                   |

---

## Architecture

### Pattern: Layered MVC

```
┌─────────────────────────────────────────────────┐
│                    FRONTEND                      │
│  React Pages → Components → API Service (Axios) │
└────────────────────┬────────────────────────────┘
                     │ HTTP / REST
┌────────────────────▼────────────────────────────┐
│                    BACKEND                       │
│  Routes → Validators → Controllers              │
│                          ↓                       │
│                      Services (Business Logic)   │
│                          ↓                       │
│                      Repositories (Data Access)  │
│                          ↓                       │
│                      Mongoose Models → MongoDB   │
└─────────────────────────────────────────────────┘
```

**Key architectural decisions:**

- **Denormalized customer data** — Customer name, email, phone, and address are duplicated into offers and orders for performance. Changes cascade via `updateManyByCustomerId`.
- **Ownership filtering** — Offers and orders track `ownerUserId`/`ownerUserEmail`. Non-superadmin users only see their own records.
- **Access codes** — Each offer gets a unique 64-char hex `accessCode` for public customer access without authentication.
- **Email templates in DB** — All email templates are stored in MongoDB and editable by admins, with factory defaults as fallback.

---

## Core Business Features

### 1. Authentication & User Management

- JWT-based auth with 7-day token expiry
- Two roles: **Admin** and **SuperAdmin**
- Password reset via email with cryptographic token (SHA-256 hashed, 15-minute expiry)
- Rate limiting: 10 login/reset attempts per 15 minutes
- SuperAdmin can create, edit, and delete users

### 2. Customer Management

- Full CRUD for business customers
- Fields: company name, business ID (Finnish format XXXXXXX-X), contact person, phone, email, address, city, postcode, logo, notes
- Three customer types: **Prospect**, **Active**, **VIP** — changeable via dropdown
- Tracks cumulative `totalSales` and `totalMargin` (auto-updated when orders complete)
- Customer discount percentage for pricing
- Demo customer seeding for new installs
- Deletion blocked if customer has any linked offers or orders

### 3. Product Catalog

- Full CRUD for products
- Each product has: product number, name, brand, category, gender, description, fabrics, purchase price, sales price, auto-calculated margin
- **Variants** — Each product can have multiple size/color/colorCode combinations with optional override pricing
- **Images** — Multiple images per product, uploaded to ImgBB
- **Excel Import** — Dual-format support:
  - Auto-detects Finnish or English column headers
  - Groups rows by product number into variants
  - Handles price parsing with € symbol, comma-separated image URLs, size normalization
  - Bulk upsert for 10,000+ row files (5MB max)
- Filtering by category, brand, gender, and full-text search
- Deletion blocked if product is referenced in active (draft/sent) offers

### 4. Quote/Offer System

- **Multi-step creation flow:**
  1. Select customer from paginated/searchable list
  2. Multi-select products with category/brand filters
  3. Customize each item: quantity, unit price, discount %, marking cost, internal marking cost
  4. Optionally generate AI mockup images
  5. Add special costs/surcharges, additional terms, validity period
  6. Submit to create draft offer

- **Offer lifecycle statuses:** `draft` → `sent` → `accepted`/`rejected`/`expired` → `completed`
- **Customer response:** `pending` → `accepted`/`rejected` (with optional comment + timestamp)
- **Versioning** — When an offer is resent after rejection, the version increments
- **Duplication** — Any offer can be duplicated into a new draft
- **Auto-expiry** — Offers automatically expire if `validUntil` date has passed
- **Offer numbering** — Auto-generated sequential format: O-001, O-002, etc.
- **Access codes** — 64-char hex codes for public customer-facing views
- **Cross-field validation** — `internalMarkingCost` cannot exceed `markingCost`
- **Rounding** — Floating-point totals are rounded to 2 decimal places

### 5. AI Mockup Generation

- Uses **Google Gemini 2.5 Flash Image** via Vercel AI Gateway
- Takes a product image + company logo and generates a realistic mockup
- Detects image dimensions and selects the closest supported aspect ratio
- **Single mode** — Generate one mockup at a time
- **Batch mode** — Process up to 20 items in parallel (3 concurrent), parsing the logo once
- Logos are compressed client-side to ~512px before upload
- Generated images hosted permanently on ImgBB
- 60-second abort timeout per generation

### 6. Order Management

- Created from accepted quotes only
- **Order numbering** — Sequential format: SO-2026-001, SO-2026-002, etc.
- Each order item can specify: selected color, selected size, printing method
- **Margin calculation:**
  - Fetches product margin % from catalog
  - App-level `marginMode`: "override" (always use custom %) or "fallback" (use custom only if product margin = 0)
  - Item margin = unitPrice × marginPercentage × quantity
  - Marking profit = (markingCost − internalMarkingCost) × quantity
  - Total adjusted by cost configurations (fixed/percentage costs and margins)
- **Status workflow:** `pending` → `processing` → `completed`/`cancelled`
  - Completing an order increments customer `totalSales` and `totalMargin`
  - Cancelling a completed order reverses those increments
  - Deleting a completed order also reverses customer totals
- Links printing sheets from the source offer

### 7. Printing Sheets

- Created per product in an order for print-shop instructions
- Fields: product info, mockup image, order date, reference, seller, delivery date/time, customer, print method, size-quantity mapping, work instructions
- Auto-computes total quantity from size-quantity map
- Grouped by `groupId` for multi-page PDF generation
- Can be created, viewed, downloaded as PDF, and deleted

### 8. Email System

- **7 email templates**, all stored in DB and editable:
  1. `password_reset` — Password reset link
  2. `offer_sent` — Offer email to customer with access link and item table
  3. `order_confirmation` — Order confirmation with item details
  4. `offer_accepted_admin` — Notify admin when customer accepts
  5. `offer_rejected_admin` — Notify admin when customer rejects
  6. `offer_accepted_customer` — Confirmation to customer after accepting
  7. `offer_rejected_customer` — Confirmation to customer after rejecting
- Templates use `{{variable}}` interpolation
- Admin notification templates require a configured `recipientEmail`
- Templates can be reset to factory defaults
- Email failures are surfaced as warnings (not silent failures)

### 9. Dashboard & Analytics

- **KPI cards:** Total offers, active orders, total sales, pending approvals
- **Financial overview:** Total revenue, total margin, profit margin %, average order value
- **7 chart visualizations:**
  1. Revenue over time (area chart, 30 days)
  2. Offers over time (line chart, 30 days)
  3. Offers by status (pie chart)
  4. Orders by status (pie chart)
  5. Customers by type (pie chart)
  6. Top customers by sales (bar chart)
  7. Top products by margin (bar chart)
- **Offers by status** — Cards grouped by: sent, accepted, rejected, draft, completed
- **Recent orders** — Quick links to order confirmations
- All stats respect ownership filtering (non-superadmin sees only their data)

### 10. Cost Configuration

- Global cost/margin configuration items
- Each config has: name, type (fixed/percentage), value, category (cost/margin), enabled flag, sort order
- **Margin calculations:**
  - Fixed costs deduct a fixed amount from margin
  - Percentage costs calculate `orderTotal × percentage / 100`
  - Category "cost" reduces margin; "margin" increases it
- Bulk save for managing multiple configs at once
- Applied during order creation and recorded per-order

### 11. Sales Reports

- SuperAdmin only
- Aggregate completed order data by:
  - Monthly revenue totals
  - Revenue by customer
  - Revenue by salesperson
- Excludes cancelled orders

### 12. App Settings

- **Custom margin percentage** — Global default margin for products without one
- **Margin mode:**
  - `fallback` — Use custom margin only when product margin is 0
  - `override` — Always use custom margin for all products
- SuperAdmin access only

---

## User Roles & Permissions

| Feature                   |     Admin     | SuperAdmin |
| ------------------------- | :-----------: | :--------: |
| View dashboard            |      ✅       |     ✅     |
| View quotes/orders        |      ✅       |     ✅     |
| Create/edit/delete quotes |      ✅       |     ✅     |
| Create orders             |      ✅       |     ✅     |
| Manage customers          |      ✅       |     ✅     |
| Manage products           |      ✅       |     ✅     |
| Generate mockups          |      ✅       |     ✅     |
| See all users' data       | ❌ (own only) |  ✅ (all)  |
| Manage users              |      ❌       |     ✅     |
| Access sales reports      |      ❌       |     ✅     |
| Edit app settings         |      ❌       |     ✅     |
| Edit email templates      |      ❌       |     ✅     |
| Manage cost configs       |      ✅       |     ✅     |

---

## Business Workflow

```
┌──────────┐    ┌──────────────┐    ┌──────────┐    ┌──────────────┐
│ Customer  │───▶│  Create      │───▶│  Send    │───▶│  Customer    │
│ Created   │    │  Quote/Offer │    │  to      │    │  Reviews     │
└──────────┘    └──────────────┘    │  Customer │    │  (Public     │
                      │             └──────────┘    │   Link)      │
                      │ Add Products                └──────┬───────┘
                      │ Set Prices                         │
                      │ Generate Mockups            ┌──────▼───────┐
                      │ Add Special Costs           │  Accept or   │
                      ▼                             │  Reject      │
                ┌──────────────┐                    └──────┬───────┘
                │  Draft Offer │                           │
                └──────────────┘                    ┌──────▼───────┐
                                                    │  If Accepted │
                                                    │  → Create    │
                                                    │    Order     │
                                                    └──────┬───────┘
                                                           │
                                              ┌────────────▼──────────────┐
                                              │  Order Processing         │
                                              │  • Create Printing Sheets │
                                              │  • Send Confirmation      │
                                              │  • Process → Complete     │
                                              │  • Updates Customer Stats │
                                              └───────────────────────────┘
```

---

## Data Models

### Entity Relationship Overview

```
User (admin/superadmin)
  │
  ├── owns ──▶ Offer (quote)
  │              │
  │              ├── has many ──▶ OfferItem (products with pricing)
  │              ├── has ──▶ OfferDetails (validity, terms, special costs)
  │              ├── belongs to ──▶ Customer
  │              ├── has ──▶ PrintingSheet(s)
  │              └── converts to ──▶ Order
  │
  ├── owns ──▶ Order (sales order)
  │              ├── has many ──▶ OrderItem (with selected color/size/print)
  │              ├── references ──▶ Offer
  │              ├── belongs to ──▶ Customer
  │              └── has ──▶ PrintingSheet(s)
  │
  Customer
  │  ├── has many ──▶ Offer(s)
  │  └── has many ──▶ Order(s)
  │
  Product
  │  ├── has many ──▶ ProductVariant(s)
  │  └── referenced by ──▶ OfferItem / OrderItem
  │
  AppSettings (singleton)
  CostConfig (many)
  EmailTemplate (7 templates)
```

### Key Models Summary

| Model             | Key Fields                                                       | Purpose            |
| ----------------- | ---------------------------------------------------------------- | ------------------ |
| **User**          | name, email, password (hashed), role                             | System users       |
| **Customer**      | companyName, businessId, type, totalSales, totalMargin           | B2B customers      |
| **Product**       | productNumber, name, prices, margin, variants[], images[]        | Product catalog    |
| **Offer**         | offerNumber, accessCode, customer info, items[], status, version | Quotes/proposals   |
| **Order**         | orderNumber, offerId, items[], totalMargin, status, salesperson  | Sales orders       |
| **PrintingSheet** | productId, sizeQuantities, printMethod, groupId                  | Print instructions |
| **CostConfig**    | name, type, value, category, enabled                             | Margin/cost rules  |
| **EmailTemplate** | templateKey, subject, htmlBody, enabled                          | Email templates    |
| **AppSettings**   | customMarginPercentage, marginMode                               | Global settings    |

---

## Cross-Cutting Concerns

### Security

- **Helmet** security headers on all responses
- **CORS** restricted to configured frontend URLs
- **Rate limiting** on authentication (10/15min) and public offer endpoints (30/15min)
- **JWT authentication** with Bearer token scheme
- **Password hashing** with bcrypt (salt rounds = 10)
- **Password reset tokens** hashed with SHA-256
- **Request validation** via express-validator on all mutation endpoints
- **Role-based authorization** middleware for protected resources
- **No email enumeration** — forgot-password always returns success

### Data Integrity

- **MongoDB indexes** optimized for common query patterns
- **Cascading updates** when customer info changes (propagates to offers/orders)
- **Atomic operations** for customer total increments (`$inc` operator)
- **Duplicate prevention** — Business IDs and emails checked for uniqueness
- **Deletion safeguards** — Can't delete customers with offers/orders or products in active offers
- **Rounding** — Financial calculations rounded to avoid floating-point drift

### Error Handling

- Global error handler catches Mongoose, express-validator, and custom `AppError` errors
- Standardized error response format with `success`, `message`, and `errors` array
- Email failures surfaced as warnings (not silent swallowing)
- Cascading customer updates wrapped in try-catch to avoid breaking the main update

### Performance

- **Lean queries** where full Mongoose documents aren't needed
- **Projection** — List queries exclude heavy `items` array
- **Compound indexes** for frequent query patterns (customerId+status, ownerUserId+createdAt)
- **Batch processing** for mockup generation (3 concurrent, logo parsed once)
- **Client-side logo compression** (~512px) before upload
- **30-second axios timeout** to prevent hanging requests
- **60-second abort timeout** on AI generation calls

### Internationalization

- English and Finnish full UI translations
- Language persisted in localStorage
- All user-facing strings go through `t()` translation function
