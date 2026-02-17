# API Test Files for Apidog

This directory contains OpenAPI 3.0 specification files for testing the E-commerce Platform APIs in Apidog.

## Files

- **seller-management-complete.openapi.json**: Complete seller application + profile specification (recommended for quick single import)
- **seller-applications.openapi.json**: Seller application workflow endpoints only
- **seller-profiles.openapi.json**: Seller profile management endpoints only
- **users.openapi.json**: User management endpoints (CRUD operations)
- **auth.openapi.json**: Authentication endpoints (signup, login, refresh, logout)
- **products.openapi.json**: Product management endpoints
- **categories.openapi.json**: Category management endpoints

## How to Import to Apidog

### Method 1: Import OpenAPI File

1. Open Apidog
2. Create a new project or select an existing one
3. Click **Import** → **OpenAPI/Swagger**
4. Select the JSON file(s) you want to import:
   - `seller-management-complete.openapi.json` (seller features combined)
   - `users.openapi.json` (user management)
  - `auth.openapi.json`
  - `products.openapi.json`
  - `categories.openapi.json`
   - Or import individual files: `seller-applications.openapi.json`, `seller-profiles.openapi.json`
5. Configure import settings:
   - ✅ Import as a new API collection
   - ✅ Generate example values
   - ✅ Create test cases from examples
6. Click **Confirm**

### Method 2: Import via URL (if hosted)

1. Host the JSON files on a server or GitHub
2. In Apidog: **Import** → **Import from URL**
3. Paste the URL to the raw JSON file
4. Click **Import**

## Environment Setup

Before testing, create an environment in Apidog with these variables:

### Environment Variables

```json
{
  "baseUrl": "http://localhost:3000",
  "customerAccessToken": "",
  "sellerAccessToken": "",
  "adminAccessToken": "",
  "testApplicationId": "",
  "testUserId": "",
  "testCategoryId": "",
  "testProductId": ""
}
```

### How to Get Access Tokens

1. **Start your NestJS server**: `npm run start:dev`

2. **Create test users** (if not already created):
   ```bash
   # Customer
   POST /auth/signup
   {
     "email": "customer@test.com",
     "name": "Test Customer",
     "password": "password123"
   }
   # Save the access_token cookie value to customerAccessToken

   # Admin (create via database or seed)
   # Update a user's role to 'admin' in the database
   POST /auth/login
   {
     "email": "admin@test.com",
     "password": "password123"
   }
   # Save the access_token cookie value to adminAccessToken
   ```

3. **Configure Apidog cookies**:
   - For each request, Apidog will automatically use the `access_token` cookie
   - The auth is defined as cookie-based in the OpenAPI specs

## Testing Workflow

### Auth Flow

#### 1. Sign Up

**Endpoint**: `POST /auth/signup`
- **Auth**: None (public endpoint)
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "name": "User Example",
    "password": "password123"
  }
  ```
- **Expected**: 201 Created
- **Note**: Save the `access_token` and `refresh_token` cookie values

#### 2. Log In

**Endpoint**: `POST /auth/login`
- **Auth**: None (public endpoint)
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Expected**: 200 OK with cookies set

#### 3. Refresh Tokens

**Endpoint**: `POST /auth/refresh`
- **Auth**: Refresh token cookie
- **Expected**: 200 OK with new cookies set

#### 4. Log Out

**Endpoint**: `POST /auth/logout`
- **Auth**: Refresh token cookie
- **Expected**: 200 OK with `{ "ok": true }`

### Categories Flow

#### 1. Create Category (Admin Only)

**Endpoint**: `POST /categories`
- **Auth**: Admin access token (cookie)
- **Body**:
  ```json
  {
    "name": "Electronics",
    "description": "Gadgets and electronic accessories"
  }
  ```
- **Expected**: 201 Created
- **Note**: Save the returned category `id` to `testCategoryId`

#### 2. List Categories (Public)

**Endpoint**: `GET /categories`
- **Auth**: None
- **Expected**: 200 OK with array of categories

#### 3. Get Category by ID (Public)

**Endpoint**: `GET /categories/{id}`
- **Path Param**: Use `testCategoryId`
- **Expected**: 200 OK

#### 4. Update Category (Admin Only)

**Endpoint**: `PATCH /categories/{id}`
- **Auth**: Admin access token (cookie)
- **Body**:
  ```json
  {
    "name": "Updated Electronics"
  }
  ```
- **Expected**: 200 OK

#### 5. Delete Category (Admin Only)

**Endpoint**: `DELETE /categories/{id}`
- **Auth**: Admin access token (cookie)
- **Expected**: 200 OK

### Products Flow

#### 1. Create Product (Admin or Seller)

**Endpoint**: `POST /products`
- **Auth**: Admin or seller access token (cookie)
- **Body**:
  ```json
  {
    "sku": "SKU-TECH-001",
    "name": "Wireless Headphones",
    "description": "Premium wireless headphones with noise cancellation",
    "price": "199.99",
    "stock": 50,
    "categoryId": "<testCategoryId>",
    "isActive": true
  }
  ```
- **Expected**: 201 Created
- **Note**: Save the returned product `id` to `testProductId`

#### 2. List Products (Public)

**Endpoint**: `GET /products`
- **Auth**: None
- **Expected**: 200 OK with array of products

#### 3. Get Product by ID (Public)

**Endpoint**: `GET /products/{id}`
- **Path Param**: Use `testProductId`
- **Expected**: 200 OK

#### 4. Update Product (Admin or Seller)

**Endpoint**: `PATCH /products/{id}`
- **Auth**: Admin or seller access token (cookie)
- **Body**:
  ```json
  {
    "price": "149.99",
    "stock": 25
  }
  ```
- **Expected**: 200 OK

#### 5. Delete Product (Admin or Seller)

**Endpoint**: `DELETE /products/{id}`
- **Auth**: Admin or seller access token (cookie)
- **Expected**: 200 OK

### Complete Seller Application Flow

#### 1. Customer Submits Application

**Endpoint**: `POST /seller-applications`
- **Auth**: Customer access token (cookie)
- **Body**:
  ```json
  {
    "storeName": "Tech Haven Store",
    "storeDescription": "Tech Haven is your one-stop shop for all the latest gadgets, electronics, and tech accessories. We pride ourselves on offering competitive prices and excellent customer service to tech enthusiasts worldwide."
  }
  ```
- **Expected**: 201 Created
- **Note**: Save the returned application `id` to `testApplicationId` variable

#### 2. Customer Checks Application Status

**Endpoint**: `GET /seller-applications/me`
- **Auth**: Customer access token
- **Expected**: 200 OK with application details (status: "pending")

#### 3. Admin Lists Pending Applications

**Endpoint**: `GET /seller-applications?status=pending`
- **Auth**: Admin access token
- **Expected**: 200 OK with array of pending applications

#### 4a. Admin Approves Application

**Endpoint**: `POST /seller-applications/{testApplicationId}/approve`
- **Auth**: Admin access token
- **Path Param**: Use `testApplicationId` from step 1
- **Expected**: 200 OK with approved application
- **Side Effects**:
  - User role updated to "seller"
  - Seller profile created automatically

#### 4b. OR Admin Rejects Application

**Endpoint**: `POST /seller-applications/{testApplicationId}/reject`
- **Auth**: Admin access token
- **Body**:
  ```json
  {
    "rejectionReason": "The store description does not provide enough information about your business model and target market."
  }
  ```
- **Expected**: 200 OK with rejected application

### Seller Profile Management Flow (After Approval)

#### 1. Seller Views Own Profile

**Endpoint**: `GET /seller-profiles/me`
- **Auth**: Seller access token (customer from above, now a seller)
- **Expected**: 200 OK with profile details

#### 2. Seller Updates Profile

**Endpoint**: `PATCH /seller-profiles/me`
- **Auth**: Seller access token
- **Body**:
  ```json
  {
    "storeName": "Tech Haven Store Premium",
    "storeDescription": "Tech Haven Premium is your premier destination for cutting-edge technology and electronics. We specialize in premium laptops, flagship smartphones, high-end gaming consoles, and smart home devices with extended warranty coverage.",
    "logoUrl": "https://cdn.example.com/logos/tech-haven.png"
  }
  ```
- **Expected**: 200 OK with updated profile

#### 3. Public Views All Seller Profiles

**Endpoint**: `GET /seller-profiles`
- **Auth**: None (public endpoint)
- **Expected**: 200 OK with array of all seller profiles

#### 4. Public Views Specific Seller Profile

**Endpoint**: `GET /seller-profiles/{userId}`
- **Auth**: None (public endpoint)
- **Path Param**: Use `testUserId` (seller's user ID)
- **Expected**: 200 OK with seller profile or null

### User Management Flow

#### 1. Create New User

**Endpoint**: `POST /users`
- **Auth**: None (public endpoint)
- **Body**:
  ```json
  {
    "email": "newuser@example.com",
    "name": "New User",
    "password": "password123"
  }
  ```
- **Expected**: 201 Created
- **Note**: Save the returned user `id` to `testUserId` variable

#### 2. Create User with Specific Role

**Endpoint**: `POST /users`
- **Body**:
  ```json
  {
    "email": "seller@example.com",
    "name": "Seller User",
    "password": "password123",
    "role": "seller"
  }
  ```
- **Expected**: 201 Created

#### 3. Get All Users (Admin Only)

**Endpoint**: `GET /users`
- **Auth**: Admin access token (cookie)
- **Expected**: 200 OK with array of users

#### 4. Get User by ID

**Endpoint**: `GET /users/{id}`
- **Auth**: Any authenticated user (cookie)
- **Path Param**: Use `testUserId`
- **Expected**: 200 OK with user details

#### 5. Update User Name

**Endpoint**: `PATCH /users/{id}`
- **Auth**: Authenticated user (cookie)
- **Path Param**: Use `testUserId`
- **Body**:
  ```json
  {
    "name": "Updated Name"
  }
  ```
- **Expected**: 200 OK with updated user

#### 6. Update User Email

**Endpoint**: `PATCH /users/{id}`
- **Body**:
  ```json
  {
    "email": "newemail@example.com"
  }
  ```
- **Expected**: 200 OK

#### 7. Update User Password

**Endpoint**: `PATCH /users/{id}`
- **Body**:
  ```json
  {
    "password": "newpassword456"
  }
  ```
- **Expected**: 200 OK

#### 8. Deactivate User

**Endpoint**: `PATCH /users/{id}`
- **Body**:
  ```json
  {
    "isActive": false
  }
  ```
- **Expected**: 200 OK

#### 9. Delete User (Admin Only)

**Endpoint**: `DELETE /users/{id}`
- **Auth**: Admin access token (cookie)
- **Path Param**: Use `testUserId`
- **Expected**: 200 OK

## Test Scenarios Included

### Auth

✅ Sign up with valid data
✅ Sign up with invalid email (should fail)
✅ Sign up with short password (should fail)
✅ Log in with valid credentials
✅ Log in with invalid credentials (should fail)
✅ Refresh with valid refresh token
✅ Refresh with missing refresh token (should fail)
✅ Log out clears cookies

### Categories

✅ Create category as admin
✅ Create category as non-admin (should fail - 403)
✅ Create category with missing name (should fail)
✅ List categories (public)
✅ Get category by ID (public)
✅ Get non-existent category (should fail - 404)
✅ Update category as admin
✅ Update category as non-admin (should fail - 403)
✅ Delete category as admin
✅ Delete category as non-admin (should fail - 403)

### Products

✅ Create product as admin
✅ Create product as seller
✅ Create product as customer (should fail - 403)
✅ Create product with invalid price (should fail)
✅ List products (public)
✅ Get product by ID (public)
✅ Update product as admin
✅ Update product as seller
✅ Update product as customer (should fail - 403)
✅ Delete product as admin
✅ Delete product as seller
✅ Delete product as customer (should fail - 403)

### Users

✅ Create customer user (default role)
✅ Create seller user (explicit role)
✅ Create admin user (explicit role)
✅ Duplicate email validation (should fail)
✅ Invalid email format (should fail)
✅ Password too short (should fail)
✅ Missing required fields (should fail)
✅ Get all users as admin
✅ Get all users as non-admin (should fail - 403)
✅ Get user by ID
✅ Get non-existent user (should fail - 404)
✅ Update user name
✅ Update user email
✅ Update to existing email (should fail)
✅ Update password
✅ Update role
✅ Deactivate user account
✅ Update multiple fields at once
✅ Delete user as admin
✅ Delete user as non-admin (should fail - 403)
✅ Delete non-existent user (should fail - 404)

### Seller Applications

✅ Submit application as customer
✅ Try to submit duplicate application (should fail)
✅ Try to submit as non-customer (should fail)
✅ Get own application status
✅ Admin lists all applications
✅ Admin filters applications by status
✅ Admin approves pending application
✅ Admin rejects pending application
✅ Try to approve/reject non-pending application (should fail)

### Seller Profiles

✅ Public lists all seller profiles
✅ Seller views own profile
✅ Seller updates store name
✅ Seller updates store description
✅ Seller adds/updates logo URL
✅ Seller updates multiple fields at once
✅ Validation: description too short (should fail)
✅ Validation: invalid logo URL (should fail)
✅ Public views specific seller profile
✅ View non-existent profile (returns null)

## Error Responses

All endpoints include example error responses:

- **400 Bad Request**: Validation errors, business logic violations
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions (wrong role)
- **404 Not Found**: Resource not found

## Notes

- All endpoints use cookie-based authentication via the `access_token` cookie
- JWT tokens are issued by the `/auth/login` and `/auth/signup` endpoints
- Role-based access control is enforced:
  - **CUSTOMER**: Can submit applications
  - **SELLER**: Can manage own profile
  - **ADMIN**: Can review applications
  - **PUBLIC**: Can view seller profiles
- UUIDs are auto-generated by the server
- Timestamps are in ISO 8601 format

## Support

For issues or questions:
1. Check the OpenAPI spec for detailed request/response schemas
2. Verify environment variables are set correctly
3. Ensure the server is running on the correct port
4. Check server logs for detailed error messages
