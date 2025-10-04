# NGO Project API

A Node.js Express API for managing NGO users and donations with comprehensive Swagger documentation.

## Features

- **User Management**: Create, read, update, and delete users with role-based access (donor, volunteer, admin)
- **Donation Tracking**: Manage donations with donor relationships and project associations
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **API Documentation**: Interactive Swagger UI documentation at `/api-docs`
- **MongoDB Integration**: Mongoose ODM for database operations
- **CORS Support**: Cross-origin resource sharing enabled

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
2. Copy the returned `_id` from the response
3. Use that `_id` as `donorId` when creating donations via `POST /donations`

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

## Error Handling

The API includes comprehensive error handling:

- `400 Bad Request` - Invalid input data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server errors

## Development

To run in development mode:
```bash
npm run dev
```

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