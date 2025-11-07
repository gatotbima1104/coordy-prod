// import fs from "fs";
// import path from "path";
// import swaggerJSDoc from "swagger-jsdoc";
// import swaggerUi from "swagger-ui-express";

// const routesPath = path.resolve(process.cwd(), "src/routes");
// const controllersPath = path.resolve(process.cwd(), "src/controllers");

// console.log("📁 Scanning paths:");
// console.log("Routes:", routesPath);
// console.log("Controllers:", controllersPath);

// const options = {
//   definition: {
//     openapi: "3.0.0",
//     info: {
//       title: "Cordy API",
//       version: "1.0.0",
//       description: "API documentation for Cordy",
//     },
//     servers: [
//       { url: "https://coordy-prod.vercel.app/api", description: "Production" },
//       { url: "http://localhost:8000/api", description: "Local" },
//     ],
//   },
//   apis: [
//     path.join(routesPath, "**/*.{ts,js}"),
//     path.join(controllersPath, "**/*.{ts,js}"),
//   ],
// };

// export const swaggerSpec = swaggerJSDoc(options);
// export { swaggerUi };
