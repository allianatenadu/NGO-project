const swaggerJsdoc = require("swagger-jsdoc");

// Dynamic server URL based on environment
const getServerUrl = () => {
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL;
  }
  if (process.env.NODE_ENV === "production") {
    return "https://ngo-project-api.onrender.com";
  }
  return "http://localhost:5000";
};

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "NGO Project API",
      version: "1.0.0",
      description:
        "API for managing NGO users, donations, projects, and events with Swagger documentation and JWT authentication",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "JWT Authorization header using the Bearer scheme. Enter your token in the text input below.",
        },
      },
      schemas: {
        User: {
          type: "object",
          required: ["name", "email", "role"],
          properties: {
            _id: {
              type: "string",
              description: "Unique identifier for the user",
            },
            name: {
              type: "string",
              description: "User full name",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
            },
            role: {
              type: "string",
              enum: ["donor", "volunteer", "admin"],
              description: "User role in the NGO",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "User creation date",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "User last update date",
            },
          },
        },
        Project: {
          type: "object",
          required: ["name", "description", "startDate", "endDate", "budget", "targetAmount", "managerId", "category"],
          properties: {
            _id: {
              type: "string",
              description: "Unique identifier for the project",
            },
            name: {
              type: "string",
              description: "Project name",
            },
            description: {
              type: "string",
              description: "Project description",
            },
            startDate: {
              type: "string",
              format: "date",
              description: "Project start date",
            },
            endDate: {
              type: "string",
              format: "date",
              description: "Project end date",
            },
            budget: {
              type: "number",
              minimum: 0,
              description: "Project budget",
            },
            targetAmount: {
              type: "number",
              minimum: 0,
              description: "Target fundraising amount",
            },
            status: {
              type: "string",
              enum: ["planning", "active", "on-hold", "completed", "cancelled"],
              description: "Project status",
            },
            managerId: {
              type: "string",
              description: "ID of the project manager",
            },
            location: {
              type: "string",
              description: "Project location",
            },
            category: {
              type: "string",
              enum: ["education", "healthcare", "environment", "community", "emergency", "other"],
              description: "Project category",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Project creation date",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Project last update date",
            },
          },
        },
        Donation: {
          type: "object",
          required: ["amount", "donorId", "projectId"],
          properties: {
            _id: {
              type: "string",
              description: "Unique identifier for the donation",
            },
            amount: {
              type: "number",
              minimum: 1,
              description: "Donation amount",
            },
            date: {
              type: "string",
              format: "date-time",
              description: "Donation date",
            },
            donorId: {
              type: "string",
              description: "ID of the donor (User)",
            },
            projectId: {
              type: "string",
              description: "ID of the project being donated to",
            },
            description: {
              type: "string",
              description: "Optional donation description",
            },
            status: {
              type: "string",
              enum: ["pending", "completed", "cancelled"],
              description: "Donation status",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Donation creation date",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Donation last update date",
            },
          },
        },
        Event: {
          type: "object",
          required: ["name", "description", "date", "endDate", "location", "organizerId", "type", "registrationDeadline"],
          properties: {
            _id: {
              type: "string",
              description: "Unique identifier for the event",
            },
            name: {
              type: "string",
              description: "Event name",
            },
            description: {
              type: "string",
              description: "Event description",
            },
            date: {
              type: "string",
              format: "date-time",
              description: "Event start date",
            },
            endDate: {
              type: "string",
              format: "date-time",
              description: "Event end date",
            },
            location: {
              type: "string",
              description: "Event location",
            },
            organizerId: {
              type: "string",
              description: "ID of the event organizer",
            },
            type: {
              type: "string",
              enum: ["fundraiser", "volunteer", "workshop", "conference", "community", "awareness", "other"],
              description: "Event type",
            },
            status: {
              type: "string",
              enum: ["planned", "active", "completed", "cancelled", "postponed"],
              description: "Event status",
            },
            maxAttendees: {
              type: "number",
              minimum: 1,
              maximum: 10000,
              description: "Maximum number of attendees",
            },
            currentAttendees: {
              type: "number",
              minimum: 0,
              description: "Current number of attendees",
            },
            registrationDeadline: {
              type: "string",
              format: "date-time",
              description: "Registration deadline",
            },
            entryFee: {
              type: "number",
              minimum: 0,
              description: "Entry fee amount",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Event creation date",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Event last update date",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    servers: [
      {
        url: getServerUrl(),
        description:
          process.env.NODE_ENV === "production"
            ? "Production server (Render)"
            : "Development server",
      },
    ],
    tags: [
      {
        name: "Authentication",
        description: "Authentication operations",
      },
      {
        name: "Users",
        description: "User management operations",
      },
      {
        name: "Donations",
        description: "Donation management operations",
      },
      {
        name: "Projects",
        description: "Project management operations",
      },
      {
        name: "Events",
        description: "Event management operations",
      },
    ],
  },
  apis: ["./routes/*.js"], // Path to the API routes
};

const specs = swaggerJsdoc(options);

module.exports = specs;
