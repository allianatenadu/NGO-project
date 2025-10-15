# NGO Project API

A Node.js Express API for managing NGO users, donations, projects, and events with comprehensive Swagger documentation and OAuth authentication.

## Features

- **User Management**: Create, read, update, and delete users with role-based access (donor, volunteer, admin)
- **Donation Tracking**: Manage donations with donor relationships and project associations
- **Project Management**: Create and manage NGO projects with budgets, timelines, and categories
- **Event Management**: Organize and track fundraising events, workshops, and volunteer activities
- **OAuth Authentication**: JWT-based authentication with role-based access control
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **API Documentation**: Interactive Swagger UI documentation at `/api-docs`
- **MongoDB Integration**: Mongoose ODM for database operations
- **CORS Support**: Cross-origin resource sharing enabled
- **Testing Suite**: Comprehensive unit tests with Jest and in-memory database

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- Swagger (OpenAPI 3.0)
- CORS
- dotenv for environment configuration

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (see Configuration section)
4. Start the server:
   ```bash
   npm start
   ```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ngo-project?retryWrites=true&w=majority
NODE_ENV=development
```

## API Endpoints

### Authentication
- `POST /auth/login` - User login (returns JWT token)
- `GET /auth/me` - Get current user information (requires authentication)

### Users
- `GET /users` - Get all users
- `POST /users` - Create a new user
- `PUT /users/:id` - Update a user
- `DELETE /users/:id` - Delete a user

### Donations
- `GET /donations` - Get all donations
- `POST /donations` - Create a new donation
- `PUT /donations/:id` - Update a donation
- `DELETE /donations/:id` - Delete a donation
- `GET /donations/donor/:donorId` - Get donations by donor

### Projects (Protected Routes)
- `GET /projects` - Get all projects
- `POST /projects` - Create a new project (requires authentication)
- `PUT /projects/:id` - Update a project (requires authentication)
- `DELETE /projects/:id` - Delete a project
- `GET /projects/manager/:managerId` - Get projects by manager

### Events (Protected Routes)
- `GET /events` - Get all events
- `POST /events` - Create a new event (requires authentication)
- `PUT /events/:id` - Update an event (requires authentication)
- `DELETE /events/:id` - Delete an event
- `GET /events/organizer/:organizerId` - Get events by organizer

## API Documentation & Testing

Interactive API documentation with testing capabilities is available at `/api-docs` when the server is running.

### Testing the API

1. **Local Testing**: Visit `http://localhost:5000/api-docs` to access Swagger UI
2. **Production Testing**: Once deployed to Render, visit `https://your-app-name.onrender.com/api-docs`

### Using Swagger UI for Testing

The Swagger UI allows you to:
- View all available endpoints with descriptions
- Test API endpoints directly from the browser
- See request/response schemas
- Try different parameter combinations

**Testing Workflow:**
1. Create a user first using `POST /users`
2. Login using `POST /auth/login` to get a JWT token
3. Copy the returned `token` from the response
4. Use that `_id` as `donorId` when creating donations via `POST /donations`
5. Use the token in the Authorization header for protected routes (Projects and Events)
6. Click the "Authorize" button in Swagger UI and enter `Bearer your-token-here`

## Data Models

### User
```javascript
{
  name: String (required),
  email: String (required, unique),
  role: String (required, enum: ['donor', 'volunteer', 'admin']),
  createdAt: Date,
  updatedAt: Date
}
```

### Donation
```javascript
{
  amount: Number (required, min: 1),
  date: Date (default: now),
  donorId: ObjectId (ref: User, required),
  projectId: String (required),
  description: String (optional),
  status: String (enum: ['pending', 'completed', 'cancelled'], default: 'pending'),
  createdAt: Date,
  updatedAt: Date
}
```

### Project
```javascript
{
  name: String (required, max: 100),
  description: String (required, max: 500),
  startDate: Date (required),
  endDate: Date (required),
  budget: Number (required, min: 0),
  targetAmount: Number (required, min: 0),
  status: String (enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled'], default: 'planning'),
  managerId: ObjectId (ref: User, required),
  location: String (optional, max: 200),
  category: String (enum: ['education', 'healthcare', 'environment', 'community', 'emergency', 'other'], required),
  createdAt: Date,
  updatedAt: Date
}
```

### Event
```javascript
{
  name: String (required, max: 100),
  description: String (required, max: 500),
  date: Date (required, future date),
  endDate: Date (required, after start date),
  location: String (required, max: 200),
  organizerId: ObjectId (ref: User, required),
  type: String (enum: ['fundraiser', 'volunteer', 'workshop', 'conference', 'community', 'awareness', 'other'], required),
  status: String (enum: ['planned', 'active', 'completed', 'cancelled', 'postponed'], default: 'planned'),
  maxAttendees: Number (optional, 1-10000),
  currentAttendees: Number (default: 0, max: maxAttendees),
  registrationDeadline: Date (required, before event date),
  entryFee: Number (default: 0, min: 0),
  createdAt: Date,
  updatedAt: Date
}
```

## Authentication

The API uses JWT (JSON Web Token) authentication for protected routes:

### Getting Started with Authentication

1. **Create a User** (POST /users)
2. **Login** (POST /auth/login) with email and password to receive a JWT token
3. **Use the Token** in the Authorization header as `Bearer your-token-here`

### Protected Routes

The following routes require authentication:
- `POST /projects` - Create project
- `PUT /projects/:id` - Update project
- `POST /events` - Create event
- `PUT /events/:id` - Update event
- `GET /auth/me` - Get current user info

### Role-Based Access

- **Admin**: Full access to all routes
- **Volunteer**: Can manage projects and events
- **Donor**: Read-only access to public routes

## Error Handling

The API includes comprehensive error handling:

- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Authentication required or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server errors

## Development

To run in development mode:
```bash
npm run dev
```

## Testing

The API includes comprehensive unit tests using Jest and MongoDB Memory Server:

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Test Structure

- **Unit Tests**: Test individual route handlers and middleware
- **In-Memory Database**: Uses MongoDB Memory Server for isolated testing
- **Mocked Dependencies**: Models are mocked to test route logic independently

### Test Files

- `tests/users.test.js` - User routes testing
- `tests/donations.test.js` - Donation routes testing
- `tests/projects.test.js` - Project routes testing
- `tests/events.test.js` - Event routes testing
- `tests/setup.js` - Test database configuration and cleanup

## Deployment

### Deploy to Render (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy NGO Project API with Swagger documentation"
   git push origin main
   ```

2. **Deploy on Render**:
   - Go to [render.com](https://render.com) and sign in
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Set the following configuration:
     - **Name**: ngo-project-api (or your preferred name)
     - **Environment**: Node
     - **Build Command**: `npm run build` (or `npm install`)
     - **Start Command**: `npm start`
     - **Publish directory**: (leave empty - this is for static sites)
     - **Plan**: Free (for testing) or paid for production

3. **Environment Variables** (in Render dashboard):
   - `MONGO_URI`: Your MongoDB connection string
   - `NODE_ENV`: production

4. **Access Your Deployed API**:
   - **Swagger UI**: `https://your-app-name.onrender.com/api-docs`
   - **API Base URL**: `https://your-app-name.onrender.com`

### Testing on Render

Once deployed, you can test the API directly from the Swagger UI:

1. Visit `https://your-app-name.onrender.com/api-docs`
2. Click "Try it out" on any endpoint
3. The server URL will automatically show your Render URL
4. Test user creation and donation creation in sequence

### Local vs Production

- **Local**: `http://localhost:5000/api-docs`
- **Production**: `https://your-app-name.onrender.com/api-docs`

## License

ISC