const swaggerJsdoc = require('swagger-jsdoc');

// Dynamic server URL based on environment
const getServerUrl = () => {
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL;
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://ngo-project-api.onrender.com';
  }
  return 'http://localhost:5000';
};

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NGO Project API',
      version: '1.0.0',
      description: 'API for managing NGO users and donations with Swagger documentation',
    },
    servers: [
      {
        url: getServerUrl(),
        description: process.env.NODE_ENV === 'production' ? 'Production server (Render)' : 'Development server',
      },
    ],
    tags: [
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Donations',
        description: 'Donation management operations'
      }
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email', 'role'],
          properties: {
            _id: {
              type: 'string',
              description: 'Unique identifier for the user',
            },
            name: {
              type: 'string',
              description: 'User full name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            role: {
              type: 'string',
              enum: ['donor', 'volunteer', 'admin'],
              description: 'User role in the NGO',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation date',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update date',
            },
          },
        },
        Donation: {
          type: 'object',
          required: ['amount', 'donorId', 'projectId'],
          properties: {
            _id: {
              type: 'string',
              description: 'Unique identifier for the donation',
            },
            amount: {
              type: 'number',
              minimum: 1,
              description: 'Donation amount',
            },
            date: {
              type: 'string',
              format: 'date-time',
              description: 'Donation date',
            },
            donorId: {
              type: 'string',
              description: 'ID of the donor (User)',
            },
            projectId: {
              type: 'string',
              description: 'ID of the project being donated to',
            },
            description: {
              type: 'string',
              description: 'Optional donation description',
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'cancelled'],
              description: 'Donation status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Donation creation date',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Donation last update date',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
      },
    },
  },
  apis: ['./routes/*.js'], // Path to the API routes
};

const specs = swaggerJsdoc(options);

module.exports = specs;