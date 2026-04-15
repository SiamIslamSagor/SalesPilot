# Customer Type Update & Order Completion Features

## Overview

This document describes two related features:

1. **Customer Type Update**: Allows logged-in users to update customer types through a dropdown UI interface
2. **Order Completion Updates**: Automatically updates customer totalSales and totalMargin when orders are completed

Both features connect the frontend with existing backend APIs and database.

## Implementation Details

### Backend (Already Existed)

The backend already had all necessary infrastructure in place:

1. **Customer Model** ([`backend/src/models/customer.model.ts`](backend/src/models/customer.model.ts:44-48))
   - Customer type field with enum values: `PROSPECT`, `ACTIVE`, `VIP`
   - Default type: `PROSPECT`

2. **API Endpoint** ([`backend/src/routes/customer.routes.ts`](backend/src/routes/customer.routes.ts:23))
   - `PUT /customers/:id` - Updates customer details including type
   - Validation for customer type field

3. **Controller** ([`backend/src/controllers/customer.controller.ts`](backend/src/controllers/customer.controller.ts:93-121))
   - `updateCustomer()` method handles type updates
   - Validates input and returns updated customer data

4. **Validator** ([`backend/src/validators/customer.validator.ts`](backend/src/validators/customer.validator.ts:123-128))
   - Ensures type is one of the valid enum values

### Frontend Implementation

#### 1. New Component: CustomerTypeDropdown

Created [`src/components/CustomerTypeDropdown.tsx`](src/components/CustomerTypeDropdown.tsx)

**Features:**

- Clickable dropdown showing current customer type
- Displays all three customer types: Prospect, Active, VIP
- Color-coded badges for each type:
  - Prospect: `status-draft` (gray)
  - Active: `status-sent` (blue)
  - VIP: `status-approved` (green)
- Loading state with spinner during updates
- Disabled state support
- Checkmark indicator for currently selected type

**Props:**

- `currentType`: Current customer type (prospect | active | vip)
- `customerId`: Customer ID for API calls
- `onTypeChange`: Callback function to handle type changes
- `disabled`: Optional prop to disable the dropdown

#### 2. Integration in Customers Page

Updated [`src/pages/Customers.tsx`](src/pages/Customers.tsx)

**Changes:**

- Imported `CustomerTypeDropdown` component
- Added `handleTypeChange()` function to call API
- Replaced static badge with dropdown component in customer table
- Shows success/error toasts on update
- Refreshes customer list after successful update

#### 3. Integration in Customer Detail Page

Updated [`src/pages/CustomerDetail.tsx`](src/pages/CustomerDetail.tsx)

**Changes:**

- Imported `CustomerTypeDropdown` component
- Added state management for customer type
- Added `handleTypeChange()` function to call API
- Replaced static badge with dropdown component
- Shows success/error toasts on update
- Updates local state after successful update

#### 4. API Service

The existing [`src/services/api.ts`](src/services/api.ts:875-920) already had the `updateCustomer()` method that accepts customer type updates.

### Testing

Created comprehensive test suite in [`src/test/customerTypeUpdate.test.tsx`](src/test/customerTypeUpdate.test.tsx)

**Test Coverage:**

1. Renders current customer type correctly
2. Opens dropdown when clicked
3. Calls onTypeChange when new type selected
4. Does not call onTypeChange when same type selected
5. Shows loading state while updating
6. Handles disabled state correctly
7. Displays correct color for each customer type

**All tests passing: 7/7 ✓**

## Usage

### For Users

1. Navigate to the Customers page or Customer Detail page
2. Click on the customer type badge (e.g., "prospect")
3. Select a new type from the dropdown (Prospect, Active, or VIP)
4. The type will update immediately with visual feedback

### For Developers

To use the `CustomerTypeDropdown` component in other parts of the application:

```tsx
import {
  CustomerTypeDropdown,
  CustomerType,
} from "@/components/CustomerTypeDropdown";

<CustomerTypeDropdown
  currentType="prospect"
  customerId="customer-id-here"
  onTypeChange={async (customerId, newType) => {
    await api.updateCustomer(customerId, { type: newType });
    // Handle success/error
  }}
/>;
```

## Customer Types

1. **Prospect** (`prospect`)
   - Default type for new customers
   - Gray badge color
   - For potential customers

2. **Active** (`active`)
   - Blue badge color
   - For customers with ongoing business

3. **VIP** (`vip`)
   - Green badge color
   - For high-value customers

## Technical Details

### API Flow

1. User clicks dropdown and selects new type
2. Frontend calls `api.updateCustomer(customerId, { type: newType })`
3. Backend validates the type value
4. Backend updates customer in database
5. Backend returns updated customer data
6. Frontend refreshes customer list
7. User sees success toast notification

### Error Handling

- Invalid type values are rejected by backend validation
- Network errors are caught and displayed to user
- Loading state prevents multiple simultaneous updates
- Disabled state prevents updates when not allowed

### UI/UX Features

- Visual feedback with color-coded badges
- Loading spinner during updates
- Toast notifications for success/error
- Checkmark indicates currently selected type
- Chevron icon indicates dropdown functionality
- Responsive design works on all screen sizes

## Files Modified/Created

### Created

- [`src/components/CustomerTypeDropdown.tsx`](src/components/CustomerTypeDropdown.tsx) - Reusable dropdown component
- [`src/test/customerTypeUpdate.test.tsx`](src/test/customerTypeUpdate.test.tsx) - Test suite

### Modified

- [`src/pages/Customers.tsx`](src/pages/Customers.tsx) - Added dropdown to customer list
- [`src/pages/CustomerDetail.tsx`](src/pages/CustomerDetail.tsx) - Added dropdown to customer detail view

### Backend (No Changes Required for Customer Type)

- [`backend/src/models/customer.model.ts`](backend/src/models/customer.model.ts) - Already supports type field
- [`backend/src/controllers/customer.controller.ts`](backend/src/controllers/customer.controller.ts) - Already has update endpoint
- [`backend/src/routes/customer.routes.ts`](backend/src/routes/customer.routes.ts) - Already has update route
- [`backend/src/validators/customer.validator.ts`](backend/src/validators/customer.validator.ts) - Already validates type field

### Backend (Modified for Order Completion)

- [`backend/src/repositories/customer.repository.ts`](backend/src/repositories/customer.repository.ts) - Added `incrementTotals()` method
- [`backend/src/services/order.service.ts`](backend/src/services/order.service.ts) - Modified `updateOrderStatus()` to update customer totals

## Build Status

✅ Backend build: Successful
✅ Frontend build: Successful
✅ All tests: Passing (7/7)

---

## Order Completion - Customer Totals Update

### Overview

When an order is marked as "completed", the customer's totalSales and totalMargin are automatically updated by adding the order's totalAmount and totalMargin to the customer's existing totals.

### Implementation Details

#### Backend Changes

1. **Customer Repository** ([`backend/src/repositories/customer.repository.ts`](backend/src/repositories/customer.repository.ts:108-119))
   - Added `incrementTotals()` method to atomically increment customer totals
   - Uses MongoDB's `$inc` operator for thread-safe updates
   - Returns updated customer data

2. **Order Service** ([`backend/src/services/order.service.ts`](backend/src/services/order.service.ts:168-195))
   - Modified `updateOrderStatus()` to update customer totals
   - When order status changes to "completed":
     - Adds order's totalAmount to customer's totalSales
     - Adds order's totalMargin to customer's totalMargin
   - When order status changes from "completed" to another status:
     - Subtracts order's totalAmount from customer's totalSales
     - Subtracts order's totalMargin from customer's totalMargin
   - Prevents duplicate increments when order is already completed

#### Key Features

1. **Atomic Updates**: Uses MongoDB's `$inc` operator to ensure thread-safe updates
2. **Bidirectional Updates**: Handles both completion and cancellation
3. **Idempotent**: Prevents duplicate increments when order is set to completed multiple times
4. **Error Handling**: Validates order exists before updating customer totals

### Testing

Created comprehensive test suite in [`backend/src/tests/orderCompletion.test.ts`](backend/src/tests/orderCompletion.test.ts)

**Test Coverage:**

1. Increments customer totals when order is completed
2. Decrements customer totals when order status changes from completed
3. Does not update totals when order status changes between non-completed states
4. Prevents multiple increments when order is set to completed again

### API Flow

**Order Completion:**

1. User updates order status to "completed"
2. Backend retrieves order details
3. Backend validates order exists
4. Backend increments customer totals using `$inc` operator
5. Backend updates order status
6. Customer's totalSales and totalMargin are updated in database

**Order Cancellation:**

1. User updates order status from "completed" to "cancelled" (or other status)
2. Backend retrieves order details
3. Backend validates order exists
4. Backend decrements customer totals using negative values
5. Backend updates order status
6. Customer's totalSales and totalMargin are reduced accordingly

### Example Scenarios

**Scenario 1: First Order Completion**

```
Customer Initial State:
- totalSales: €1,000
- totalMargin: €200

Order Completed:
- totalAmount: €500
- totalMargin: €100

Customer Final State:
- totalSales: €1,500 (€1,000 + €500)
- totalMargin: €300 (€200 + €100)
```

**Scenario 2: Order Cancellation**

```
Customer Initial State:
- totalSales: €1,500
- totalMargin: €300

Order Cancelled:
- totalAmount: €500
- totalMargin: €100

Customer Final State:
- totalSales: €1,000 (€1,500 - €500)
- totalMargin: €200 (€300 - €100)
```

**Scenario 3: Multiple Orders**

```
Customer Initial State:
- totalSales: €0
- totalMargin: €0

Order 1 Completed: €500 sales, €100 margin
Order 2 Completed: €300 sales, €50 margin
Order 3 Completed: €700 sales, €150 margin

Customer Final State:
- totalSales: €1,500 (€0 + €500 + €300 + €700)
- totalMargin: €300 (€0 + €100 + €50 + €150)
```

### Files Modified/Created

#### Created

- [`backend/src/tests/orderCompletion.test.ts`](backend/src/tests/orderCompletion.test.ts) - Test suite for order completion

#### Modified

- [`backend/src/repositories/customer.repository.ts`](backend/src/repositories/customer.repository.ts) - Added `incrementTotals()` method
- [`backend/src/services/order.service.ts`](backend/src/services/order.service.ts) - Modified `updateOrderStatus()` to update customer totals

### Benefits

1. **Automatic Updates**: Customer totals are always accurate without manual intervention
2. **Real-time Tracking**: Sales and margin data is updated immediately when orders are completed
3. **Data Integrity**: Atomic updates prevent race conditions and ensure data consistency
4. **Reversible**: Cancellations automatically adjust customer totals
5. **Audit Trail**: Order history can be used to verify customer totals

## Future Enhancements

### Customer Type Feature

- Add permission checks to restrict who can update customer types
- Add audit logging to track type changes
- Add bulk update functionality for multiple customers
- Add filtering/sorting by customer type
- Add customer type analytics and reporting

### Order Completion Feature

- Add audit logging for customer total updates
- Add customer total history tracking
- Add notifications when customer reaches sales milestones
- Add customer tiering based on total sales
- Add reports showing customer sales trends over time
