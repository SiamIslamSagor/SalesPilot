# User CRUD API Documentation

## Overview

This document provides comprehensive documentation for the User CRUD (Create, Read, Update, Delete) operations in the ProdPros application. The API follows RESTful conventions and uses Express.js with MongoDB.

## Base URL

```
http://localhost:5000/api/users
```

_Note: Replace `localhost:5000` with your actual server URL in production._

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

---

## Data Models

### User Model

The User entity has the following structure:

| Field       | Type   | Required       | Description                                               |
| ----------- | ------ | -------------- | --------------------------------------------------------- |
| `_id`       | String | Auto-generated | Unique identifier (MongoDB ObjectId)                      |
| `name`      | String | Yes            | User's full name (2-100 characters)                       |
| `email`     | String | Yes            | User's email address (must be unique and valid)           |
| `password`  | String | Yes            | User's password (min 6 characters, hashed before storage) |
| `role`      | String | No             | User role: `admin` or `superadmin` (default: `admin`)     |
| `createdAt` | Date   | Auto           | Timestamp when user was created                           |
| `updatedAt` | Date   | Auto           | Timestamp when user was last updated                      |

### User Roles

```typescript
enum UserRole {
  ADMIN = "admin",
  SUPERADMIN = "superadmin",
}
```

---

## API Endpoints

### 1. Create User

Creates a new user in the system.

**Endpoint:** `POST /api/users`

**Request Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "Password123",
  "role": "admin"
}
```

**Field Validation:**

| Field      | Validation Rules                                                          | Error Message                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`     | Required, 2-100 characters                                                | "Name is required" or "Name must be between 2 and 100 characters"                                                                                                 |
| `email`    | Required, valid email format, unique                                      | "Email is required" or "Please provide a valid email address"                                                                                                     |
| `password` | Required, min 6 characters, must contain uppercase, lowercase, and number | "Password is required" or "Password must be at least 6 characters" or "Password must contain at least one uppercase letter, one lowercase letter, and one number" |
| `role`     | Optional, must be one of: `admin`, `superadmin`                           | "Role must be one of: admin, superadmin"                                                                                                                          |

**Success Response:**

_Status Code:_ `201 Created`

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "admin",
    "createdAt": "2026-03-02T15:30:00.000Z",
    "updatedAt": "2026-03-02T15:30:00.000Z"
  }
}
```

**Error Responses:**

_Status Code:_ `400 Bad Request` - Validation Error

```json
{
  "success": false,
  "message": "Validation Error",
  "errors": [
    {
      "type": "field",
      "value": "",
      "msg": "Name is required",
      "path": "name",
      "location": "body"
    }
  ]
}
```

_Status Code:_ `409 Conflict` - Duplicate Email

```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

_Status Code:_ `500 Internal Server Error`

```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

---

### 2. Get All Users

Retrieves a paginated list of users with optional filtering by role.

**Endpoint:** `GET /api/users`

**Query Parameters:**

| Parameter | Type    | Required | Default | Description                              |
| --------- | ------- | -------- | ------- | ---------------------------------------- |
| `page`    | Integer | No       | 1       | Page number (1-indexed)                  |
| `limit`   | Integer | No       | 10      | Number of users per page                 |
| `role`    | String  | No       | -       | Filter by role (`admin` or `superadmin`) |

**Example Request:**

```
GET /api/users?page=1&limit=10&role=admin
```

**Success Response:**

_Status Code:_ `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "admin",
      "createdAt": "2026-03-02T15:30:00.000Z",
      "updatedAt": "2026-03-02T15:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Jane Smith",
      "email": "jane.smith@example.com",
      "role": "superadmin",
      "createdAt": "2026-03-02T15:31:00.000Z",
      "updatedAt": "2026-03-02T15:31:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "pages": 3,
    "limit": 10
  }
}
```

**Error Responses:**

_Status Code:_ `500 Internal Server Error`

```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

---

### 3. Get User by ID

Retrieves a single user by their unique identifier.

**Endpoint:** `GET /api/users/:id`

**URL Parameters:**

| Parameter | Type   | Required | Description                  |
| --------- | ------ | -------- | ---------------------------- |
| `id`      | String | Yes      | MongoDB ObjectId of the user |

**Example Request:**

```
GET /api/users/507f1f77bcf86cd799439011
```

**Success Response:**

_Status Code:_ `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "admin",
    "createdAt": "2026-03-02T15:30:00.000Z",
    "updatedAt": "2026-03-02T15:30:00.000Z"
  }
}
```

**Error Responses:**

_Status Code:_ `400 Bad Request` - Invalid ID Format

```json
{
  "success": false,
  "message": "Invalid ID format"
}
```

_Status Code:_ `404 Not Found` - User Not Found

```json
{
  "success": false,
  "message": "User not found"
}
```

_Status Code:_ `500 Internal Server Error`

```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

---

### 4. Update User

Updates an existing user's information. Only the fields provided in the request body will be updated.

**Endpoint:** `PUT /api/users/:id`

**URL Parameters:**

| Parameter | Type   | Required | Description                            |
| --------- | ------ | -------- | -------------------------------------- |
| `id`      | String | Yes      | MongoDB ObjectId of the user to update |

**Request Headers:**

```
Content-Type: application/json
```

**Request Body (all fields optional):**

```json
{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "password": "NewPassword123",
  "role": "superadmin"
}
```

**Field Validation:**

| Field      | Validation Rules                                                              | Error Message                                                                                                                           |
| ---------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `name`     | 2-100 characters (if provided)                                                | "Name must be between 2 and 100 characters"                                                                                             |
| `email`    | Valid email format, unique (if provided)                                      | "Please provide a valid email address" or "Email already in use"                                                                        |
| `password` | Min 6 characters, must contain uppercase, lowercase, and number (if provided) | "Password must be at least 6 characters" or "Password must contain at least one uppercase letter, one lowercase letter, and one number" |
| `role`     | Must be one of: `admin`, `superadmin` (if provided)                           | "Role must be one of: admin, superadmin"                                                                                                |

**Success Response:**

_Status Code:_ `200 OK`

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Updated",
    "email": "john.updated@example.com",
    "role": "superadmin",
    "createdAt": "2026-03-02T15:30:00.000Z",
    "updatedAt": "2026-03-02T15:35:00.000Z"
  }
}
```

**Error Responses:**

_Status Code:_ `400 Bad Request` - Validation Error

```json
{
  "success": false,
  "message": "Validation Error",
  "errors": [
    {
      "type": "field",
      "value": "invalid-email",
      "msg": "Please provide a valid email address",
      "path": "email",
      "location": "body"
    }
  ]
}
```

_Status Code:_ `400 Bad Request` - Invalid ID Format

```json
{
  "success": false,
  "message": "Invalid ID format"
}
```

_Status Code:_ `404 Not Found` - User Not Found

```json
{
  "success": false,
  "message": "User not found"
}
```

_Status Code:_ `409 Conflict` - Email Already in Use

```json
{
  "success": false,
  "message": "Email already in use"
}
```

_Status Code:_ `500 Internal Server Error`

```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

---

### 5. Delete User

Permanently deletes a user from the system.

**Endpoint:** `DELETE /api/users/:id`

**URL Parameters:**

| Parameter | Type   | Required | Description                            |
| --------- | ------ | -------- | -------------------------------------- |
| `id`      | String | Yes      | MongoDB ObjectId of the user to delete |

**Example Request:**

```
DELETE /api/users/507f1f77bcf86cd799439011
```

**Success Response:**

_Status Code:_ `200 OK`

```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "admin",
    "createdAt": "2026-03-02T15:30:00.000Z",
    "updatedAt": "2026-03-02T15:30:00.000Z"
  }
}
```

**Error Responses:**

_Status Code:_ `400 Bad Request` - Invalid ID Format

```json
{
  "success": false,
  "message": "Invalid ID format"
}
```

_Status Code:_ `404 Not Found` - User Not Found

```json
{
  "success": false,
  "message": "User not found"
}
```

_Status Code:_ `500 Internal Server Error`

```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

---

## Error Response Format

All error responses follow a consistent format:

### Standard Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific error message"
    }
  ]
}
```

### HTTP Status Codes

| Status Code | Description                                           |
| ----------- | ----------------------------------------------------- |
| `200`       | OK - Request successful                               |
| `201`       | Created - Resource created successfully               |
| `400`       | Bad Request - Invalid input or validation error       |
| `404`       | Not Found - Resource not found                        |
| `409`       | Conflict - Duplicate resource (e.g., duplicate email) |
| `500`       | Internal Server Error - Server-side error             |

### Error Types

1. **Validation Errors** - Input validation failures

   - Status: `400`
   - Includes array of field-specific errors

2. **Not Found Errors** - Resource doesn't exist

   - Status: `404`
   - Simple message

3. **Conflict Errors** - Duplicate resource

   - Status: `409`
   - Simple message

4. **Server Errors** - Unexpected server errors
   - Status: `500`
   - Generic message

---

## Usage Examples

### cURL Examples

#### Create User

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "Password123",
    "role": "admin"
  }'
```

#### Get All Users

```bash
curl -X GET "http://localhost:5000/api/users?page=1&limit=10"
```

#### Get User by ID

```bash
curl -X GET http://localhost:5000/api/users/507f1f77bcf86cd799439011
```

#### Update User

```bash
curl -X PUT http://localhost:5000/api/users/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "role": "superadmin"
  }'
```

#### Delete User

```bash
curl -X DELETE http://localhost:5000/api/users/507f1f77bcf86cd799439011
```

### JavaScript/Fetch Examples

#### Create User

```javascript
const response = await fetch("http://localhost:5000/api/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "John Doe",
    email: "john.doe@example.com",
    password: "Password123",
    role: "admin",
  }),
});

const data = await response.json();
console.log(data);
```

#### Get All Users

```javascript
const response = await fetch("http://localhost:5000/api/users?page=1&limit=10");
const data = await response.json();
console.log(data);
```

#### Get User by ID

```javascript
const userId = "507f1f77bcf86cd799439011";
const response = await fetch(`http://localhost:5000/api/users/${userId}`);
const data = await response.json();
console.log(data);
```

#### Update User

```javascript
const userId = "507f1f77bcf86cd799439011";
const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "John Updated",
    role: "superadmin",
  }),
});

const data = await response.json();
console.log(data);
```

#### Delete User

```javascript
const userId = "507f1f77bcf86cd799439011";
const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
  method: "DELETE",
});

const data = await response.json();
console.log(data);
```

---

## Notes

1. **Password Security**: Passwords are automatically hashed using bcrypt before storage. The password field is never returned in API responses.

2. **Email Uniqueness**: Email addresses must be unique across all users. Attempting to create or update a user with an existing email will result in a conflict error.

3. **Timestamps**: `createdAt` and `updatedAt` timestamps are automatically managed by MongoDB and should not be included in request bodies.

4. **Partial Updates**: The update endpoint supports partial updates. Only the fields included in the request body will be modified.

5. **Pagination**: The get all users endpoint supports pagination. Use the `page` and `limit` query parameters to navigate through large datasets.

6. **Sorting**: Users are returned in descending order by creation date (newest first) when using the get all users endpoint.

7. **ID Format**: User IDs are MongoDB ObjectIds and must be valid 24-character hexadecimal strings.

---

## Database Information

- **Database Name**: `ProdProsDB`
- **Collection Name**: `users`
- **Database Type**: MongoDB (MongoDB Atlas)

---

## Related Files

- Routes: [`backend/src/routes/user.routes.ts`](../src/routes/user.routes.ts)
- Controller: [`backend/src/controllers/user.controller.ts`](../src/controllers/user.controller.ts)
- Service: [`backend/src/services/user.service.ts`](../src/services/user.service.ts)
- Repository: [`backend/src/repositories/user.repository.ts`](../src/repositories/user.repository.ts)
- Model: [`backend/src/models/user.model.ts`](../src/models/user.model.ts)
- Validators: [`backend/src/validators/user.validator.ts`](../src/validators/user.validator.ts)
- Types: [`backend/src/types/user.types.ts`](../src/types/user.types.ts)
- Error Handler: [`backend/src/middlewares/errorHandler.middleware.ts`](../src/middlewares/errorHandler.middleware.ts)

---

_Last Updated: 2026-03-02_
