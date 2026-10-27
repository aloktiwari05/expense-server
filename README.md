# Expense Tracker API

A Node.js + Express backend for an expense tracking application built with MongoDB and JWT authentication. The API supports user registration and login, secure access to personal transactions, budget tracking, dashboard summaries, and Google OAuth sign-in.

## Features

- User authentication with email/password
- JWT-based protected routes
- Google OAuth login support
- Personal transaction management (income and expense)
- Budget creation and tracking by category
- Dashboard summary with total income, expense, balance, and budget usage
- MongoDB persistence through Mongoose
- CORS-enabled API for frontend integration

## Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT
- Passport.js
- bcryptjs
- express-validator
- dotenv
- cors

## Project Structure

```text
server/
├── index.js                 # Application entry point
├── .env.example            # Example environment configuration
├── middleware/
│   └── auth.js             # JWT middleware
├── models/
│   ├── Budget.js           # Budget schema
│   ├── Transaction.js      # Transaction schema
│   └── User.js             # User schema
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── budgets.js          # Budget routes
│   └── transactions.js     # Transaction routes
├── package.json
├── package-lock.json
└── README.md
```

## Prerequisites

Before running the project, make sure you have:

- Node.js 18 or newer
- MongoDB running locally or a MongoDB Atlas connection string
- A frontend app running on a local origin such as http://localhost:5173 (for development)

## Installation

1. Clone the repository and navigate to the server folder:

```bash
cd expense-tracker-mern/server
```

2. Install dependencies:

```bash
npm install
```

3. Create a .env file in the server root and add the required configuration values:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/expense_tracker
JWT_SECRET=your_jwt_secret
CLIENT_ORIGIN=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret
```

## Running the Server

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

By default, the API runs on:

```text
http://localhost:5000
```

## Authentication

Most API routes require a Bearer token. Log in or register first to receive a JWT, then include it in the Authorization header:

```http
Authorization: Bearer <your_token>
```

### Google OAuth

The app supports Google login through Passport.js.

- GET /api/auth/google
- GET /api/auth/google/callback

On successful authentication, the backend redirects the user to the frontend with a JWT token in the query string.

## API Endpoints

### Auth Routes

- POST /api/auth/register — Register a new user
- POST /api/auth/login — Log in a user
- GET /api/auth/me — Get current user information
- PUT /api/auth/profile — Update user profile or password
- DELETE /api/auth/account — Delete the current user account

Example registration request:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "secret123"
  }'
```

### Transaction Routes

- GET /api/transactions — Get all transactions for the authenticated user
- GET /api/transactions/summary — Get dashboard summary and active budgets
- POST /api/transactions — Create a new transaction
- PUT /api/transactions/:id — Update a transaction
- DELETE /api/transactions/:id — Delete a transaction

Transaction payload example:

```json
{
  "amount": 250.75,
  "type": "expense",
  "category": "Food",
  "date": "2026-10-27",
  "note": "Groceries"
}
```

### Budget Routes

- GET /api/budgets — Get all budgets for the authenticated user
- POST /api/budgets — Create a budget
- PUT /api/budgets/:id — Update a budget
- DELETE /api/budgets/:id — Delete a budget

Budget payload example:

```json
{
  "category": "Food",
  "amount": 600,
  "period": "monthly",
  "startDate": "2026-10-01"
}
```

## Example Requests

Get all transactions:

```bash
curl -H "Authorization: Bearer <your_token>" http://localhost:5000/api/transactions
```

Get the dashboard summary:

```bash
curl -H "Authorization: Bearer <your_token>" http://localhost:5000/api/transactions/summary
```

## Notes

- The app stores each transaction and budget per authenticated user, so data is isolated by user.
- Passwords are hashed using bcryptjs before being stored.
- JWT_SECRET should be a long random string in production.
- In a production setup, use environment variables for all secrets and avoid hardcoded credentials.

## License

This project is licensed under the ISC license.
