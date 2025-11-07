import swaggerJSDoc from "swagger-jsdoc";
import fs from "fs";
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
  },
  apis: [
    "src/routes/**/*.ts",
    "src/controllers/**/*.ts"
  ],
};

const swaggerSpec = swaggerJSDoc(options);

const outputDir = path.resolve("public");
const outputPath = path.join(outputDir, "swagger.json");

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));

console.log("✅ Swagger JSON generated at:", outputPath);
