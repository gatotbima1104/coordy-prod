import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import path from "path";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Cordy API",
      version: "1.0.0",
      description: "API documentation for Cordy",
    },
    servers: [
      { url: "https://coordy-prod.vercel.app/api", description: "Production" },
      { url: "http://localhost:8000/api", description: "Local" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    path.join(__dirname, "../routes/*.{ts,js}"),
    path.join(__dirname, "../controllers/*.{ts,js}"),
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
export { swaggerUi };