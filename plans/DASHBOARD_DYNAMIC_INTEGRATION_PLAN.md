# Dashboard Dynamic Integration Plan

## Overview

This plan outlines the steps to make the Dashboard page fully functional with backend APIs and database integration, replacing mock data with real-time data from the database.

## Current State Analysis

### Dashboard UI Components

The Dashboard page currently displays:

1. **Stats Cards** (4 cards):
   - Total Offers
   - Active Orders
   - Total Sales
   - Pending Approval (sent offers)

2. **Quotes/Offer Lists by Status** (5 lists):
   - Sent offers
   - Approved (accepted) offers
   - Rejected offers
   - Draft (In Progress) offers
   - Completed offers

### Backend Models

- **Offer Model**: `draft`, `sent`, `accepted`, `rejected`, `expired`, `completed`
- **Order Model**: `pending`, `processing`, `completed`, `cancelled`

### Existing APIs

- Offers: `GET /api/offers` (with pagination and status filter)
- Orders: `GET /api/orders` (with pagination and status filter)

## Implementation Plan

### Phase 1: Backend Development

#### 1.1 Create Dashboard Types

**File**: `backend/src/types/dashboard.types.ts`

- Define interface for dashboard statistics
- Define interface for dashboard offer lists

#### 1.2 Create Dashboard Service

**File**: `backend/src/services/dashboard.service.ts`

- Aggregate statistics from Offer and Order collections
- Calculate total offers count
- Calculate active orders (non-completed)
- Calculate total sales from orders
- Calculate pending approval (sent offers)
- Fetch offers grouped by status (limit to recent 5-10 per status)

#### 1.3 Create Dashboard Controller

**File**: `backend/src/controllers/dashboard.controller.ts`

- Implement `getDashboardStats` endpoint
- Handle errors and edge cases
- Return structured data for frontend

#### 1.4 Create Dashboard Routes

**File**: `backend/src/routes/dashboard.routes.ts`

- Define route: `GET /api/dashboard/stats`
- Apply necessary middleware (auth, validation if needed)

#### 1.5 Register Dashboard Routes

**File**: `backend/src/app.ts`

- Import and register dashboard routes

### Phase 2: Frontend Development

#### 2.1 Create Dashboard Types

**File**: `src/types/dashboard.types.ts`

- Define TypeScript interfaces matching backend response

#### 2.2 Create Dashboard API Service

**File**: `src/services/dashboard.service.ts`

- Create function to fetch dashboard stats
- Handle API errors
- Transform data if needed

#### 2.3 Update Dashboard Component

**File**: `src/pages/Dashboard.tsx`

- Replace mock data with API calls
- Add loading states (skeletons or spinners)
- Add error handling with user-friendly messages
- Implement data refresh functionality
- Keep existing UI components (StatCard, QuotesByStatus)

#### 2.4 Add Real-time Updates (Optional Enhancement)

- Consider adding auto-refresh or polling
- Add manual refresh button
- Display last updated timestamp

## Data Flow

### Backend Flow

1. Frontend requests `GET /api/dashboard/stats`
2. Dashboard controller calls dashboard service
3. Dashboard service queries Offer and Order collections
4. Service aggregates and calculates statistics
5. Controller returns structured JSON response

### Frontend Flow

1. Dashboard component mounts
2. Calls dashboard service API
3. Displays loading state
4. Receives data and updates state
5. Renders stats cards and offer lists
6. Handles errors gracefully

## API Response Structure

```typescript
{
  success: true,
  data: {
    stats: {
      totalOffers: number,
      activeOrders: number,
      totalSales: number,
      pendingApproval: number
    },
    offersByStatus: {
      sent: Array<Offer>,
      accepted: Array<Offer>,
      rejected: Array<Offer>,
      draft: Array<Offer>,
      completed: Array<Offer>
    }
  }
}
```

## Edge Cases to Handle

1. **No Data**: Display appropriate empty states
2. **API Errors**: Show user-friendly error messages with retry option
3. **Loading States**: Show skeleton loaders or spinners
4. **Large Datasets**: Limit results per status (e.g., 5-10 recent offers)
5. **Performance**: Use database indexes for efficient queries
6. **Authentication**: Ensure dashboard endpoint is protected

## Success Criteria

- [ ] Dashboard displays real-time data from database
- [ ] All statistics are accurate and up-to-date
- [ ] Loading states are displayed during data fetch
- [ ] Error states are handled gracefully
- [ ] UI remains responsive and user-friendly
- [ ] Performance is acceptable (queries complete in < 1 second)
- [ ] Code follows existing project patterns and conventions

## Testing Checklist

- [ ] Test with empty database
- [ ] Test with sample data
- [ ] Test error scenarios (API failure, timeout)
- [ ] Test loading states
- [ ] Verify statistics accuracy
- [ ] Check responsive design on different screen sizes
- [ ] Verify data refresh functionality

## Future Enhancements

1. Add date range filters for statistics
2. Add charts/graphs for visual data representation
3. Add export functionality for dashboard data
4. Add drill-down capabilities (click on stats to see details)
5. Add real-time updates using WebSocket
6. Add user-specific dashboard views
7. Add performance metrics and trends
