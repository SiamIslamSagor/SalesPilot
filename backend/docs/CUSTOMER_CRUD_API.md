# Customer CRUD API Documentation

## Overview

This document describes the Customer CRUD API implementation, which allows managing customer data in the system.

## API Endpoints

### Base URL

```
/api/customers
```

### 1. Seed Demo Customers

Create 10 demo customers if none exist in the database.

**Endpoint:** `POST /api/customers/seed`

**Response:**

```json
{
  "success": true,
  "message": "Demo customers seeded successfully",
  "data": [
    {
      "_id": "string",
      "companyName": "string",
      "businessId": "string",
      "contactPerson": "string",
      "phone": "string",
      "email": "string",
      "address": "string",
      "city": "string",
      "postcode": "string",
      "type": "prospect" | "active" | "vip",
      "totalSales": number,
      "totalMargin": number,
      "discountPercent": number,
      "createdAt": "ISO8601Date",
      "updatedAt": "ISO8601Date"
    }
  ]
}
```

### 2. Create Customer

Create a new customer.

**Endpoint:** `POST /api/customers`

**Request Body:**

```json
{
  "companyName": "string (required, 2-200 chars)",
  "businessId": "string (required, format: XXXXXXX-X)",
  "contactPerson": "string (required, 2-100 chars)",
  "phone": "string (required, valid phone number)",
  "email": "string (required, valid email)",
  "address": "string (required, max 500 chars)",
  "city": "string (required, 2-100 chars)",
  "postcode": "string (required, 2-20 chars, letters/numbers/spaces/hyphen)",
  "type": "prospect | active | vip (optional, default: prospect)",
  "totalSales": "number (optional, min: 0, default: 0)",
  "totalMargin": "number (optional, min: 0, default: 0)",
  "discountPercent": "number (optional, min: 0, max: 100, default: 0)"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Customer created successfully",
  "data": {
    "_id": "string",
    "companyName": "string",
    "businessId": "string",
    "contactPerson": "string",
    "phone": "string",
    "email": "string",
    "address": "string",
    "city": "string",
    "postcode": "string",
    "type": "prospect" | "active" | "vip",
    "totalSales": number,
    "totalMargin": number,
    "discountPercent": number,
    "createdAt": "ISO8601Date",
    "updatedAt": "ISO8601Date"
  }
}
```

### 3. Get All Customers

Retrieve all customers with pagination and optional filtering.

**Endpoint:** `GET /api/customers`

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `type` (optional): Filter by customer type ("prospect", "active", "vip")

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "companyName": "string",
      "businessId": "string",
      "contactPerson": "string",
      "phone": "string",
      "email": "string",
      "address": "string",
      "type": "prospect" | "active" | "vip",
      "totalSales": number,
      "totalMargin": number,
      "discountPercent": number,
      "createdAt": "ISO8601Date",
      "updatedAt": "ISO8601Date"
    }
  ],
  "pagination": {
    "total": number,
    "page": number,
    "pages": number,
    "limit": number
  }
}
```

### 4. Get Customer by ID

Retrieve a single customer by ID.

**Endpoint:** `GET /api/customers/:id`

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "string",
    "companyName": "string",
    "businessId": "string",
    "contactPerson": "string",
    "phone": "string",
    "email": "string",
    "address": "string",
    "city": "string",
    "postcode": "string",
    "type": "prospect" | "active" | "vip",
    "totalSales": number,
    "totalMargin": number,
    "discountPercent": number,
    "createdAt": "ISO8601Date",
    "updatedAt": "ISO8601Date"
  }
}
```

### 5. Update Customer

Update an existing customer.

**Endpoint:** `PUT /api/customers/:id`

**Request Body:** (all fields optional)

```json
{
  "companyName": "string (2-200 chars)",
  "businessId": "string (format: XXXXXXX-X)",
  "contactPerson": "string (2-100 chars)",
  "phone": "string (valid phone number)",
  "email": "string (valid email)",
  "address": "string (max 500 chars)",
  "city": "string (2-100 chars)",
  "postcode": "string (2-20 chars, letters/numbers/spaces/hyphen)",
  "type": "prospect | active | vip",
  "totalSales": "number (min: 0)",
  "totalMargin": "number (min: 0)",
  "discountPercent": "number (min: 0, max: 100)"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Customer updated successfully",
  "data": {
    "_id": "string",
    "companyName": "string",
    "businessId": "string",
    "contactPerson": "string",
    "phone": "string",
    "email": "string",
    "address": "string",
    "city": "string",
    "postcode": "string",
    "type": "prospect" | "active" | "vip",
    "totalSales": number,
    "totalMargin": number,
    "discountPercent": number,
    "createdAt": "ISO8601Date",
    "updatedAt": "ISO8601Date"
  }
}
```

### 6. Delete Customer

Delete a customer by ID.

**Endpoint:** `DELETE /api/customers/:id`

**Response:**

```json
{
  "success": true,
  "message": "Customer deleted successfully",
  "data": {
    "_id": "string",
    "companyName": "string",
    "businessId": "string",
    "contactPerson": "string",
    "phone": "string",
    "email": "string",
    "address": "string",
    "city": "string",
    "postcode": "string",
    "type": "prospect" | "active" | "vip",
    "totalSales": number,
    "totalMargin": number,
    "discountPercent": number,
    "createdAt": "ISO8601Date",
    "updatedAt": "ISO8601Date"
  }
}
```

## Customer Types

### CustomerType Enum

- `PROSPECT`: Potential customer (default)
- `ACTIVE`: Active customer with purchases
- `VIP`: Very important customer with special privileges

## Data Model

### Customer Schema

```typescript
{
  companyName: String (required, 2-200 chars)
  businessId: String (required, unique, format: XXXXXXX-X)
  contactPerson: String (required, 2-100 chars)
  phone: String (required)
  email: String (required, valid email)
  address: String (required, max 500 chars)
  city: String (required, 2-100 chars)
  postcode: String (required, 2-20 chars)
  type: String (enum: ["prospect", "active", "vip"], default: "prospect")
  totalSales: Number (default: 0, min: 0)
  totalMargin: Number (default: 0, min: 0)
  discountPercent: Number (default: 0, min: 0, max: 100)
  createdAt: Date (auto-generated)
  updatedAt: Date (auto-generated)
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "message": "Error message describing what went wrong",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

### Common Error Codes

- `400`: Bad Request (validation errors)
- `404`: Not Found (customer not found)
- `500`: Internal Server Error

## Demo Customers

The system includes 10 demo customers that can be seeded:

1. **Yritys ABC Oy** - VIP customer with high sales
2. **Brändivaate Oy** - Active customer
3. **Tech Solutions Finland** - Active customer
4. **Green Events Oy** - Prospect customer
5. **Digital Marketing Pro** - Active customer
6. **Nordic Design Studio** - VIP customer
7. **Suomi Tech Solutions** - Active customer
8. **Event Planning Oy** - Prospect customer
9. **Finnish Logistics Group** - Active customer
10. **Creative Solutions Finland** - VIP customer

## Implementation Details

### Backend Files

- `backend/src/types/customer.types.ts` - TypeScript interfaces and types
- `backend/src/models/customer.model.ts` - Mongoose model
- `backend/src/repositories/customer.repository.ts` - Data access layer
- `backend/src/services/customer.service.ts` - Business logic layer
- `backend/src/controllers/customer.controller.ts` - Request handlers
- `backend/src/routes/customer.routes.ts` - Route definitions
- `backend/src/validators/customer.validator.ts` - Request validation
- `backend/src/app.ts` - App configuration (updated to include customer routes)

### Frontend Files

- `src/services/api.ts` - API service methods (updated with customer methods)
- `src/pages/Customers.tsx` - Customers page (updated to fetch from API)

## Usage Example

### Frontend Usage

```typescript
import api from "@/services/api";

// Fetch all customers
const response = await api.fetchCustomers({ page: 1, limit: 10 });

// Create a new customer
const newCustomer = await api.createCustomer({
  companyName: "Example Company",
  businessId: "1234567-8",
  contactPerson: "John Doe",
  phone: "+358 40 123 4567",
  email: "john@example.com",
  address: "Example Street 1, 00100 Helsinki",
  city: "Helsinki",
  postcode: "00100",
  type: "prospect",
});

// Update a customer
const updatedCustomer = await api.updateCustomer(customerId, {
  companyName: "Updated Company Name",
});

// Delete a customer
await api.deleteCustomer(customerId);

// Seed demo customers
const seededCustomers = await api.seedCustomers();
```

## Notes

- All dates are in ISO 8601 format
- Business ID must follow Finnish format: 7 digits, hyphen, 1 digit (e.g., "1234567-8")
- Phone numbers should include country code (e.g., "+358")
- Email addresses are case-insensitive and stored in lowercase
- The `seed` endpoint only creates customers if the database is empty
- Customer IDs are auto-generated MongoDB ObjectId strings
