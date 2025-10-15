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
