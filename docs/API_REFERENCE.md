# API Reference

Complete REST API documentation for the Prod-Pros backend.

**Base URL:** `/api`

**Authentication:** Most endpoints require a JWT token in the `Authorization: Bearer <token>` header.

**Standard Response Format:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Success message",
  "pagination": { "page": 1, "limit": 10, "total": 50, "totalPages": 5 }
}
```

**Error Response Format:**

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Field-level error 1", "Field-level error 2"]
}
```

---

## Authentication

### POST `/auth/login`

**Public** | Rate Limited: 10/15min

Login with email and password.

| Param    | Type   | Required | Notes       |
| -------- | ------ | -------- | ----------- |
| email    | string | Yes      | Valid email |
| password | string | Yes      | Min 6 chars |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "John",
    "email": "john@example.com",
    "role": "admin"
  },
  "token": "eyJhbGciOiJ..."
}
```

---

### POST `/auth/forgot-password`

**Public** | Rate Limited: 10/15min

Request a password reset email. Always returns success to prevent email enumeration.

| Param | Type   | Required |
| ----- | ------ | -------- |
| email | string | Yes      |

---

### POST `/auth/reset-password`

**Public** | Rate Limited: 10/15min

Reset password using a token from the email link.

| Param           | Type   | Required | Notes                                             |
| --------------- | ------ | -------- | ------------------------------------------------- |
| token           | string | Yes      | Token from email link                             |
| password        | string | Yes      | Min 6, must include uppercase + lowercase + digit |
| confirmPassword | string | Yes      | Must match password                               |

---

## Users

All endpoints: **Auth Required** | **SuperAdmin Only**

### GET `/users`

List users with optional pagination and role filter.

| Query Param | Type   | Default | Notes                           |
| ----------- | ------ | ------- | ------------------------------- |
| page        | number | 1       | Page number                     |
| limit       | number | 10      | Items per page                  |
| role        | string | -       | Filter: `admin` \| `superadmin` |

### GET `/users/:id`

Get a single user by ID.

### POST `/users`

Create a new user.

| Param    | Type   | Required | Notes                                    |
| -------- | ------ | -------- | ---------------------------------------- |
| name     | string | Yes      | 2-100 chars                              |
| email    | string | Yes      | Valid email, lowercase                   |
| password | string | Yes      | Min 6, uppercase + lowercase + digit     |
| role     | string | No       | `admin` \| `superadmin` (default: admin) |

### PUT `/users/:id`

Update user. All fields optional.

### DELETE `/users/:id`

Delete a user.

---

## Customers

All endpoints: **Auth Required** | **Admin or SuperAdmin**

### GET `/customers`

List customers with pagination and filters.

| Query Param   | Type   | Default | Notes                                                                                   |
| ------------- | ------ | ------- | --------------------------------------------------------------------------------------- |
| page          | number | 1       |                                                                                         |
| limit         | number | 10      |                                                                                         |
| type          | string | -       | `prospect` \| `active` \| `vip`                                                         |
| search        | string | -       | Searches: companyName, contactPerson, businessId, email, city, postcode, phone, address |
| createdAtFrom | string | -       | ISO date lower bound                                                                    |
| createdAtTo   | string | -       | ISO date upper bound                                                                    |

### GET `/customers/:id`

Get single customer.

### POST `/customers`

Create customer.

| Param           | Type   | Required | Notes                           |
| --------------- | ------ | -------- | ------------------------------- |
| companyName     | string | Yes      | 2-200 chars                     |
| businessId      | string | Yes      | Finnish format: XXXXXXX-X       |
| contactPerson   | string | Yes      | 2-100 chars                     |
| phone           | string | Yes      | Valid phone format              |
| email           | string | Yes      | Valid email                     |
| address         | string | Yes      | Max 500 chars                   |
| city            | string | Yes      | 2-100 chars                     |
| postcode        | string | Yes      | 2-20 chars, alphanumeric        |
| notes           | string | No       | Max 5000 chars                  |
| companyLogo     | string | No       | Base64 image or URL             |
| type            | string | No       | `prospect` \| `active` \| `vip` |
| discountPercent | number | No       | 0-100                           |

### PUT `/customers/:id`

Update customer. All fields optional. Changes cascade to offers and orders.

### DELETE `/customers/:id`

Delete customer. **Blocked** if customer has any linked offers or orders.

### POST `/customers/seed`

Seed 10 demo customers (only if DB is empty).

---

## Products

All endpoints: **Auth Required** | **Admin or SuperAdmin**

### GET `/products`

List products with filters and optional pagination.

| Query Param    | Type   | Default | Notes                                |
| -------------- | ------ | ------- | ------------------------------------ |
| page           | number | -       | Omit to get all products             |
| limit          | number | 10      |                                      |
| category       | string | -       | Filter by category                   |
| brand          | string | -       | Filter by brand                      |
| gender         | string | -       | Filter by gender                     |
| search         | string | -       | Full-text search on name/description |
| ids            | string | -       | Comma-separated IDs                  |
| productNumbers | string | -       | Comma-separated product numbers      |

### GET `/products/:id`

Get single product.

### POST `/products`

Create product.

| Param         | Type     | Required | Notes                                  |
| ------------- | -------- | -------- | -------------------------------------- |
| productNumber | string   | Yes      | Unique                                 |
| name          | string   | Yes      |                                        |
| brand         | string   | No       | Default: "Unknown"                     |
| category      | string   | No       | Default: "Uncategorized"               |
| gender        | string   | No       | Default: "Unisex"                      |
| description   | string   | No       |                                        |
| fabrics       | string   | No       |                                        |
| purchasePrice | number   | No       | Min 0                                  |
| salesPrice    | number   | No       | Min 0                                  |
| status        | string   | No       | `active` \| `inactive`                 |
| images        | string[] | No       | Base64 images (uploaded to ImgBB)      |
| variants      | array    | No       | `[{ size, color, colorCode, price? }]` |

### PUT `/products/:id`

Update product. All fields optional.

### DELETE `/products/:id`

Delete product. **Blocked** if referenced in active (draft/sent) offers.

### POST `/products/import`

Import products from Excel file.

| Param | Type | Required | Notes                  |
| ----- | ---- | -------- | ---------------------- |
| file  | File | Yes      | .xlsx or .xls, max 5MB |

Auto-detects Finnish or English column format. Groups rows by product number into variants. Bulk upserts.

**Response:**

```json
{
  "success": true,
  "data": {
    "importedCount": 150,
    "failedCount": 2,
    "errors": ["Row 45: missing product number"]
  }
}
```

### GET `/products/categories`

Returns distinct category values.

### GET `/products/brands`

Returns distinct brand values.

### GET `/products/genders`

Returns distinct gender values.

---

## Offers

### Public Endpoints (No Auth | Rate Limited: 30/15min)

#### GET `/offers/public/:accessCode`

Get offer by public access code. Auto-checks expiry.

#### PATCH `/offers/public/:accessCode/response`

Customer responds to offer.

| Param    | Type   | Required | Notes                     |
| -------- | ------ | -------- | ------------------------- |
| response | string | Yes      | `accepted` \| `rejected`  |
| comment  | string | No       | Optional customer comment |

Sends notification emails to admin and customer.

---

### Authenticated Endpoints (Admin or SuperAdmin)

#### POST `/offers`

Create a new draft offer.

| Param         | Type   | Required | Notes                          |
| ------------- | ------ | -------- | ------------------------------ |
| customerId    | string | Yes      | Customer ObjectId              |
| customerName  | string | Yes      | 2-200 chars                    |
| contactPerson | string | Yes      | 2-100 chars                    |
| email         | string | Yes      | Valid email                    |
| phone         | string | Yes      | Valid phone                    |
| address       | string | Yes      | Max 500 chars                  |
| items         | array  | Yes      | Min 1 item (see below)         |
| offerDetails  | object | No       | Validity, terms, special costs |
| totalAmount   | number | Yes      | Min 0                          |
| itemCount     | number | Yes      | Min 1                          |

**Item fields:**
| Field | Type | Required | Notes |
|---|---|---|---|
| productId | string | Yes | Product ObjectId |
| productNumber | string | Yes | |
| productName | string | Yes | Max 200 |
| quantity | number | Yes | Min 1 |
| unitPrice | number | Yes | Min 0 |
| discount | number | Yes | 0-100% |
| markingCost | number | Yes | Min 0 |
| internalMarkingCost | number | Yes | Min 0, must be ≤ markingCost |
| showUnitPrice | boolean | Yes | |
| showTotalPrice | boolean | Yes | |
| hideMarkingCost | boolean | Yes | |
| generateMockup | boolean | Yes | |

**OfferDetails:**
| Field | Type | Required | Notes |
|---|---|---|---|
| validUntil | string | No | ISO 8601 date |
| validDays | number | No | Positive integer |
| showTotalPrice | boolean | Yes | |
| additionalTermsEnabled | boolean | Yes | |
| additionalTerms | string | No | Max 2000 chars |
| specialCosts | array | No | `[{ name (max 200), amount (min 0) }]` |

#### GET `/offers`

List offers with pagination and filters.

| Query Param | Type   | Notes                             |
| ----------- | ------ | --------------------------------- |
| page        | number | Default: 1                        |
| limit       | number | Default: 10                       |
| status      | string | Filter by status                  |
| search      | string | Regex on offerNumber/customerName |

#### GET `/offers/:id`

Get single offer. Enriches items with product images. Auto-checks expiry.

#### GET `/offers/customer/:customerId`

Get offers for a specific customer with pagination.

#### PUT `/offers/:id`

Update offer. Recalculates totalAmount.

#### PATCH `/offers/:id/status`

Update offer status.

| Param  | Type   | Required                                                                        |
| ------ | ------ | ------------------------------------------------------------------------------- |
| status | string | Yes — `draft` \| `sent` \| `accepted` \| `rejected` \| `expired` \| `completed` |

#### PATCH `/offers/:id/response`

Update customer response (admin action).

| Param    | Type   | Required                       |
| -------- | ------ | ------------------------------ |
| response | string | Yes — `accepted` \| `rejected` |
| comment  | string | No                             |

#### POST `/offers/:id/send`

Transition offer from draft to sent and send email to customer.

**Response includes `warning` field if email delivery failed.**

#### POST `/offers/:id/resend`

Resend a previously sent/rejected offer. Increments version, resets status to sent.

**Response includes `warning` field if email delivery failed.**

#### POST `/offers/:id/duplicate`

Create a new draft copy of the offer with new offerNumber and accessCode.

#### DELETE `/offers/:id`

Delete an offer.

---

### Mockup Generation

#### POST `/offers/generate-mockup`

Generate single AI mockup.

| Param           | Type   | Required | Notes                      |
| --------------- | ------ | -------- | -------------------------- |
| productImageUrl | string | Yes      | URL of product image       |
| logoImage       | string | Yes      | Base64 or data URI of logo |

**Response:**

```json
{ "success": true, "data": { "mockupImageUrl": "https://i.ibb.co/..." } }
```

#### POST `/offers/generate-mockup-batch`

Generate mockups for multiple products.

| Param     | Type   | Required | Notes                                      |
| --------- | ------ | -------- | ------------------------------------------ |
| logoImage | string | Yes      | Base64 or data URI                         |
| items     | array  | Yes      | Max 20. Each: `{ index, productImageUrl }` |

**Response:**

```json
{
  "success": true,
  "data": {
    "results": [
      { "index": 0, "success": true, "mockupImageUrl": "https://..." },
      { "index": 1, "success": false, "error": "Generation failed" }
    ]
  }
}
```

---

## Orders

All endpoints: **Auth Required** | **Admin or SuperAdmin** (except sales report: SuperAdmin only)

### POST `/orders`

Create order from an accepted quote.

| Param       | Type   | Required | Notes                                                           |
| ----------- | ------ | -------- | --------------------------------------------------------------- |
| offerId     | string | Yes      | Accepted offer ObjectId                                         |
| items       | array  | Yes      | Array with selectedColor, selectedSize, printingMethod per item |
| salesperson | string | No       |                                                                 |

Generates SO-YYYY-NNN order number. Calculates margins. Links printing sheets. Sets offer status to "completed".

### GET `/orders`

List orders with filters.

| Query Param  | Type   | Notes                                                   |
| ------------ | ------ | ------------------------------------------------------- |
| page         | number | Default: 1                                              |
| limit        | number | Default: 10                                             |
| status       | string | `pending` \| `processing` \| `completed` \| `cancelled` |
| customerId   | string | Filter by customer                                      |
| search       | string | Regex on orderNumber/offerNumber                        |
| orderNumber  | string | Exact match                                             |
| customerName | string | Regex match                                             |

### GET `/orders/:id`

Get single order with access control.

### PUT `/orders/:id/status`

Update order status with state machine validation.

| Param  | Type   | Required | Notes                  |
| ------ | ------ | -------- | ---------------------- |
| status | string | Yes      | Valid transitions only |

**Valid transitions:**

- `pending` → `processing`, `cancelled`
- `processing` → `completed`, `cancelled`
- `completed` → (terminal)
- `cancelled` → (terminal)

Completing an order increments customer `totalSales` and `totalMargin`.

### POST `/orders/:id/send-confirmation`

Send order confirmation email. Updates status to "processing".

### DELETE `/orders/:id`

Delete order. Reverses customer totals if order was completed.

### GET `/orders/sales-report`

**SuperAdmin Only**

Returns aggregated sales data:

```json
{
  "totals": { "totalRevenue": 50000, "totalMargin": 15000, "orderCount": 25 },
  "byCustomer": [
    {
      "customerId": "...",
      "customerName": "...",
      "revenue": 10000,
      "margin": 3000
    }
  ],
  "bySalesperson": [
    { "salesperson": "John", "revenue": 20000, "orderCount": 10 }
  ]
}
```

---

## Printing Sheets

All endpoints: **Auth Required** | **Admin or SuperAdmin**

### POST `/printingsheets`

Create printing sheets (batch).

| Param   | Type   | Required | Notes                  |
| ------- | ------ | -------- | ---------------------- |
| offerId | string | Yes      |                        |
| orderId | string | No       |                        |
| sheets  | array  | Yes      | Array of sheet objects |

**Sheet fields:** productId, productNumber, productName, productImage, mockupImage, orderDate, reference, seller, deliveryDate, deliveryTime, customerName, printMethod, printMethodOther, sizeQuantities, workInstructions, groupId

### GET `/printingsheets/offer/:offerId`

Get printing sheets for an offer.

### GET `/printingsheets/order/:orderId`

Get printing sheets for an order.

### DELETE `/printingsheets/group/:groupId`

Delete printing sheets by groupId or single sheet by \_id.

---

## Dashboard

### GET `/dashboard/stats`

**Auth Required** | **Admin or SuperAdmin**

Returns comprehensive dashboard data:

```json
{
  "stats": { "totalOffers": 50, "activeOrders": 10, "totalSales": 100000, "pendingApproval": 5 },
  "offerStats": { "byStatus": [...], "conversionRate": 45, "responseRate": 80, "averageValue": 2500, "topOffers": [...], "offersOverTime": [...] },
  "orderStats": { "byStatus": [...], "totalMargin": 30000, "profitMarginPercentage": 30, "ordersByCustomer": [...], "ordersOverTime": [...] },
  "customerStats": { "total": 25, "byType": [...], "totalSales": 100000, "topCustomers": [...] },
  "productStats": { "total": 200, "byStatus": [...], "byCategory": [...], "averageMargin": 35, "topProductsByMargin": [...] },
  "financialStats": { "totalRevenue": 100000, "totalMargin": 30000, "profitMarginPercentage": 30, "averageOrderValue": 4000, "revenueOverTime": [...] },
  "printingSheetStats": { "total": 45, "byPrintMethod": [...], "totalQuantity": 5000 },
  "offersByStatus": { "sent": [...], "accepted": [...], "rejected": [...], "draft": [...], "completed": [...] }
}
```

All stats respect ownership filtering (non-superadmin sees only their own data).

---

## Email Templates

All endpoints: **Auth Required** | **SuperAdmin Only**

### GET `/email-templates`

List all 7 templates. Seeds missing defaults from factory.

### GET `/email-templates/:key`

Get template by key (e.g., `offer_sent`).

### PUT `/email-templates/:key`

Update template.

| Param          | Type    | Notes                                                   |
| -------------- | ------- | ------------------------------------------------------- |
| subject        | string  | Email subject line                                      |
| htmlBody       | string  | HTML with {{variable}} placeholders                     |
| enabled        | boolean | Enable/disable template                                 |
| recipientEmail | string  | Override recipient (required to enable admin templates) |

### POST `/email-templates/:key/reset`

Reset template to factory default.

---

## App Settings

All endpoints: **Auth Required** | **SuperAdmin Only**

### GET `/app-settings`

Get current app settings.

### PUT `/app-settings`

Update settings.

| Param                  | Type   | Notes                    |
| ---------------------- | ------ | ------------------------ |
| customMarginPercentage | number | 0-100                    |
| marginMode             | string | `fallback` \| `override` |

---

## Cost Configuration

All endpoints: **Auth Required** | **Admin or SuperAdmin**

### GET `/cost-config`

List all cost configs sorted by sortOrder.

### GET `/cost-config/:id`

Get single config.

### POST `/cost-config`

Create new cost config.

| Param     | Type    | Required | Notes                          |
| --------- | ------- | -------- | ------------------------------ |
| name      | string  | Yes      | Max 200 chars                  |
| type      | string  | Yes      | `fixed` \| `percentage`        |
| value     | number  | Yes      | 0-100000 (capped at 100 for %) |
| category  | string  | Yes      | `cost` \| `margin`             |
| enabled   | boolean | No       | Default: true                  |
| sortOrder | number  | No       | Display order                  |

### POST `/cost-config/bulk-save`

Bulk upsert configs. Items with `_id` are updated; without are created.

### PUT `/cost-config/:id`

Update config.

### DELETE `/cost-config/:id`

Delete config.
