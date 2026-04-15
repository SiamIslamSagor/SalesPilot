# Frontend Architecture Documentation

## Overview

The frontend is a **React 18 + TypeScript** single-page application built with **Vite**, styled with **Tailwind CSS** and **shadcn/ui** components. It features multi-language support (English/Finnish), role-based access control, and a responsive design for desktop and mobile.

---

## Directory Structure

```
src/
├── App.tsx                   # Root component with routing
├── main.tsx                  # Entry point (providers setup)
├── index.css                 # Global styles + Tailwind
├── components/
│   ├── AppLayout.tsx         # Main layout (sidebar + content)
│   ├── ProtectedRoute.tsx    # Auth + role guard wrapper
│   ├── CustomerTypeDropdown.tsx
│   ├── DashboardCharts.tsx   # 7 chart components
│   ├── ImageLightbox.tsx     # Full-screen image viewer
│   ├── MockupBatchSection.tsx
│   ├── MockupGeneratorDialog.tsx
│   ├── NavLink.tsx
│   ├── OfferItemPickerDialog.tsx
│   ├── Pagination.tsx
│   ├── ProductAddDialog.tsx
│   ├── ProductDetailDialog.tsx
│   ├── ProductEditDialog.tsx
│   ├── ProductImportDialog.tsx
│   ├── ProductPickerDialog.tsx
│   ├── SortableHeader.tsx
│   ├── financial/            # Financial display components
│   └── ui/                   # 42+ shadcn/ui components
├── contexts/
│   └── AuthContext.tsx        # Auth state + user management
├── hooks/
│   ├── use-mobile.tsx         # Mobile viewport detection
│   ├── use-toast.ts           # Toast notifications
│   └── useSortable.ts         # Table sorting logic
├── i18n/
│   ├── LanguageContext.tsx     # i18n provider
│   └── translations.ts        # EN/FI translation strings
├── lib/
│   ├── utils.ts               # cn() class name helper
│   └── imageUtils.ts          # Image handling utilities
├── pages/                     # 25 page components
├── services/
│   └── api.ts                 # Axios API service (singleton)
├── types/                     # TypeScript types
└── data/
    └── mockData.ts            # Type definitions + mock data
```

---

## Routing

All routes are defined in `App.tsx` using React Router v6:

### Public Routes (No Auth)

| Path                     | Page           | Description                     |
| ------------------------ | -------------- | ------------------------------- |
| `/`                      | Login          | Email/password authentication   |
| `/forgot-password`       | ForgotPassword | Request password reset          |
| `/reset-password/:token` | ResetPassword  | Reset with token                |
| `/offers/:id`            | OfferView      | Public offer view for customers |

### Protected Routes (Auth Required)

| Path                                  | Page              | Roles             | Description                   |
| ------------------------------------- | ----------------- | ----------------- | ----------------------------- |
| `/dashboard`                          | Dashboard         | All               | Business overview + analytics |
| `/quotes`                             | Quotes            | All               | List/manage all offers        |
| `/quotes/new`                         | NewQuote          | Admin, SuperAdmin | Multi-step quote creation     |
| `/quotes/:id`                         | QuoteDetail       | All               | View/edit single quote        |
| `/quotes/duplicate/:id`               | QuoteDuplicate    | Admin, SuperAdmin | Duplicate a quote             |
| `/orders`                             | Orders            | All               | List/manage orders            |
| `/orders/create/:quoteId`             | OrderCreate       | Admin, SuperAdmin | Create order from quote       |
| `/orders/create/:quoteId/print-sheet` | PrintingSheet     | Admin, SuperAdmin | Create printing sheets        |
| `/orders/confirm/:orderId`            | OrderConfirmation | All               | View/manage order             |
| `/customers`                          | Customers         | Admin, SuperAdmin | Customer list                 |
| `/customers/:id`                      | CustomerDetail    | Admin, SuperAdmin | Customer detail/edit          |
| `/products`                           | Products          | Admin, SuperAdmin | Product catalog               |
| `/products/new`                       | ProductCreate     | Admin, SuperAdmin | Create product                |
| `/products/:id/edit`                  | ProductEdit       | Admin, SuperAdmin | Edit product                  |
| `/sales-reports`                      | SalesReports      | SuperAdmin        | Sales analytics               |
| `/users`                              | Users             | SuperAdmin        | User management               |
| `/users/new`                          | UserCreate        | SuperAdmin        | Create user                   |
| `/settings`                           | Settings          | SuperAdmin        | App configuration             |

### Route Protection

`ProtectedRoute` component wraps protected routes:

- Checks `AuthContext` for logged-in user
- Optionally validates `allowedRoles` array
- Redirects to `/` (login) if not authenticated
- Redirects to `/quotes` if role insufficient

---

## Pages — Detailed Descriptions

### Dashboard

- Fetches all stats via `api.getDashboardStats()`
- Displays: KPI cards (offers, orders, sales, pending), financial overview (revenue, margin, profit %, avg order value)
- Shows offers grouped by status as clickable cards
- Lists recent orders with links to order confirmations
- Top customers by sales, top products by margin
- 7 interactive charts (see DashboardCharts component)

### Quotes (Offer List)

- Fetches offers via `api.getOffers()` with pagination (10/page)
- Search by offer number, filter by status
- Advanced filters: customer response, amount range, date range, contact person
- Sortable columns: offer number, customer, items, status, response, valid until, amount, dates
- Actions per row: view, duplicate, delete, change status, create sales order (if accepted)
- Role-based: all users can view; admin/superadmin can create/edit/duplicate/delete

### QuoteDetail (Single Offer)

- Fetches offer via `api.getOfferById()` and maps to internal Quote type
- Displays: offer number, customer info, version, status, items table, special costs, terms
- Edit mode (for draft/rejected offers): modify quantities, prices, discounts, marking costs
- Mockup generation: upload logo, batch generate mockups for all items
- Send/resend offer email with warning display if email fails
- Duplicate button, save changes button
- Shows customer response history with timestamps and comments

### NewQuote (Create Offer)

- **Step 1 — Customer Selection:** Search + paginated customer list
- **Step 2 — Product Selection:** Multi-select products with category/brand filters
- **Step 3 — Review & Customize:** Per-item pricing (unit price, quantity, discount, marking costs), mockup generation with batch support, special costs/surcharges, validity period (date ↔ days sync), additional terms
- Submits via `api.createOffer()`

### QuoteDuplicate

- Pre-fills all items, pricing, and settings from source quote
- Allows customer re-selection and modifications before creating new draft

### Orders (Order List)

- Fetches via `api.getOrders()` with pagination (10/page)
- Search by order number and customer name
- Filter by status; advanced filters: salesperson, amount range, margin range, date range
- Sortable columns: order number, customer, offer ref, status, salesperson, date, amount, margin
- Actions: view, export to PDF, update status, send confirmation email
- PDF export with multi-page printing sheets grouped by `groupId`

### OrderCreate

- Creates order from an accepted quote
- Shows quote items with product details
- Per-item selection: color, size, printing method
- Printing sheet management (create, view, download PDF, delete)
- Submits via `api.createOrderFromQuote()`
- Requires quote status = "accepted"

### OrderConfirmation

- Displays order details, customer info, items, financial summary
- Shows printing sheets grouped by `groupId`
- Actions: download printing sheet PDFs, send confirmation email, update status to processing
- Auto-PDF mode (triggered by `?autoPdf=1` query param)
- Margin and cost config details shown

### Customers

- List with search by company name, date range filters (presets: 1m, 2m, 3m, 6m, 12m, custom)
- Shows: logo, company name, business ID, city, postcode, join date
- Create customer dialog with logo upload
- Delete customer button
- Seed demo data on first use
- Click row to navigate to customer detail

### CustomerDetail

- Edit all customer fields including logo upload
- Customer type dropdown (Prospect/Active/VIP)
- Stats: total sales, total margin, discount %, approval rate %
- Two sortable tables: customer's offers and customer's orders
- Save changes button

### Products (Catalog)

- Grid display of product cards (12/page)
- Search, filter by category and brand
- Card shows: image, name, number, category, description, prices, margin %
- Selection checkboxes for bulk operations
- Actions: view detail dialog, edit, delete (single or bulk)
- "Create offer from selected" button
- Import products from Excel button

### ProductCreate / ProductEdit

- Form: product number, name, description, category, brand, gender, status, fabrics
- Image management: upload from file or add by URL
- Pricing: purchase price, sales price, margin % (auto-calculated)
- Variants table: dynamically add/remove rows with size, color, color code (color picker), SKU, price
- Field-level validation

### Users (SuperAdmin)

- List all system users
- Create new user with name, email, password, role
- Delete users
- Initiate password reset

### OfferView (Public)

- No authentication required — accessed via offer `accessCode`
- Shows offer details, items, pricing, validity
- Customer can accept or reject with an optional comment
- Sends admin + customer notification emails on response

### PrintingSheet

- Form to create printing instruction sheets
- Fields: print method, work instructions, size-quantity table
- Shows product image and mockup image
- Linked to offer and optionally to order

### SalesReports (SuperAdmin)

- Revenue aggregations by month, customer, and salesperson
- Based on completed orders only

### Settings (SuperAdmin)

- App settings: custom margin percentage, margin mode (fallback/override)
- Cost configuration management
- Email template editor

---

## Key Components

### AppLayout

- Main layout wrapper for all authenticated pages
- Collapsible sidebar with navigation items
- Items shown based on user role:
  - All: Dashboard, Offers, Orders
  - Admin+: Customers, Products
  - SuperAdmin: Sales Reports, Users, Settings
- Language switcher (EN/FI)
- User display + logout button
- Responsive: mobile overlay when collapsed

### DashboardCharts

Collection of 7 **Recharts** chart components:

1. **RevenueChart** — Area chart of revenue over 30 days
2. **OffersOverTimeChart** — Line chart of daily offer creation
3. **OffersByStatusChart** — Pie chart of offer status distribution
4. **OrdersByStatusChart** — Pie chart of order status distribution
5. **CustomerTypesChart** — Pie chart of Prospect/Active/VIP distribution
6. **TopCustomersChart** — Horizontal bar chart of top customers by sales
7. **TopProductsChart** — Horizontal bar chart of top products by margin

### ImageLightbox

- Full-screen overlay for viewing product images and mockups
- Click any product image → opens lightbox
- Used throughout offer creation flow and product pages

### MockupBatchSection

- Upload a single logo image (compressed to ~512px client-side)
- Select multiple products for batch mockup generation
- Calls `api.generateMockupBatch()` — processes up to 20 items, 3 concurrent
- Shows progress and results

### MockupGeneratorDialog

- Single mockup generation in a dialog
- Upload logo, select product image, generate, preview result

### Pagination

- Reusable page navigation component
- Props: `currentPage`, `totalPages`, `onPageChange`
- Used on all list pages

### SortableHeader

- Click-to-sort table header
- Cycles through: ascending → descending → none
- Shows sort direction indicator

### CustomerTypeDropdown

- Dropdown to change customer type (Prospect/Active/VIP)
- Color-coded badges per type
- Used in customer list and detail pages

### ProductImportDialog

- Drag-drop or file select for Excel (.xlsx/.xls)
- Shows import progress and results (success/failure counts)

### ProtectedRoute

- Wraps routes requiring authentication
- Optional role requirements via `allowedRoles` prop
- Redirects appropriately on auth/role failure

---

## State Management

### AuthContext

- **State:** `user` (current user), `users` (all users list)
- **Methods:** `login()`, `logout()`, `addUser()`, `updateUser()`, `removeUser()`
- **Computed:** `isSuperAdmin`, `isPrivilegedUser`
- **Persistence:** JWT token → `localStorage.qt_token`, user data → `localStorage.qt_user`

### LanguageContext

- **State:** `language` (`en` | `fi`)
- **Methods:** `setLanguage()`, `t(key)` (translation lookup)
- **Persistence:** `localStorage.qt_lang`
- **Translations:** Centralized in `i18n/translations.ts` covering all UI strings

### React Query

- Server state caching via `QueryClientProvider` in App.tsx
- Used for API response caching and refetching

### Component-Level State

- Form inputs, UI toggles, modal visibility via `useState`
- Table sorting via `useSortable` hook

---

## Custom Hooks

### `useAuth()`

Returns: `{ user, users, login, logout, addUser, updateUser, removeUser, isSuperAdmin, isPrivilegedUser }`
Must be used within `AuthProvider`.

### `useLanguage()`

Returns: `{ language, setLanguage, t }`
Must be used within `LanguageProvider`.

### `useSortable<T>(data, defaultKey?, defaultDir?)`

Generic sorting hook for arrays. Returns: `{ sorted, sortKey, sortDir, handleSort }`
Handles ascending/descending/none toggle.

### `useMobile()`

Returns `isMobile` boolean based on viewport width.

### `useToast()`

Returns `{ toast }` for showing notification toasts via shadcn toaster.

---

## API Service

`src/services/api.ts` exports a singleton `ApiService` class wrapping Axios:

### Configuration

- Base URL from `VITE_API_URL` environment variable
- 30-second default timeout
- JSON content type

### Interceptors

- **Request:** Attaches `Authorization: Bearer <token>` from localStorage
- **Response:** Auto-logout on 401 (clears localStorage, redirects to login)

### Standardized Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  warning?: string;
  errors?: string[];
  pagination?: { page; limit; total; totalPages };
}
```

### Available Methods

**Auth:** `login()`, `forgotPassword()`, `resetPasswordWithToken()`, `resetPassword()`

**Users:** `fetchUsers()`, `createUser()`, `deleteUser()`

**Products:** `fetchProducts()`, `fetchProductById()`, `createProduct()`, `updateProduct()`, `deleteProduct()`, `fetchCategories()`, `fetchBrands()`, `fetchGenders()`

**Customers:** `fetchCustomers()`, `createCustomer()`, `getCustomerById()`, `updateCustomer()`, `deleteCustomer()`, `seedCustomers()`

**Offers:** `getOffers()`, `getOfferById()`, `createOffer()`, `updateOffer()`, `deleteOffer()`, `duplicateOffer()`, `sendOffer()`, `resendOffer()`, `getOffersByCustomerId()`, `updateCustomerResponse()`, `updateOfferStatus()`, `getOfferByAccessCode()`, `updateCustomerResponseByAccessCode()`

**Mockups:** `generateMockupImage()`, `generateMockupBatch()`

**Orders:** `getOrders()`, `getOrderById()`, `createOrderFromQuote()`, `updateOrderStatus()`, `sendOrderConfirmationEmail()`

**Printing Sheets:** `getPrintingSheets()`, `createPrintingSheets()`, `deletePrintingSheetGroup()`

**Dashboard:** `getDashboardStats()`

**Settings:** `getAppSettings()`, `updateAppSettings()`

**Cost Config:** `getCostConfigs()`, `saveCostConfigs()`

**Email Templates:** `getEmailTemplates()`, `getEmailTemplate()`, `updateEmailTemplate()`, `resetEmailTemplate()`

**Sales Reports:** `getSalesReport()`

---

## UI Component Library

42+ components from **shadcn/ui** (Radix UI + Tailwind CSS):

accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input-otp, input, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast, toaster, toggle-group, toggle, tooltip

---

## Environment Variables (Frontend)

| Variable       | Description                                                                |
| -------------- | -------------------------------------------------------------------------- |
| `VITE_API_URL` | Backend API base URL (e.g., `http://localhost:5000/api` or production URL) |
