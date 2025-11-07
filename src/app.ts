import express, { Application, Request, Response, NextFunction } from "express";
import { PORT } from "./configs/config";
import { authRouter } from "./routes/auth.route";
import { eventRouter } from "./routes/event.route";
import { voteRouter } from "./routes/vote.route";
import { aasaRouter } from "./routes/aasa.route";
import { aiRouter } from "./routes/ai.route";
import { notificationRouter } from "./routes/notification.route";
import path from "path";
import fs from "fs";
import swaggerUi from "swagger-ui-express";
import cors from "cors";

export class App {
  private app: Application;

  constructor() {
    this.app = express();
    this.configure();
    this.routes();
    this.swaggerDocs();
    this.handleError();
  }

  // Public getter to access the app instance
  public get instance(): Application {
    return this.app;
  }

  // express configuration
  private configure() {
    this.app.use(express.json());
    this.app.use(
      cors({
        origin: "*",
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        allowedHeaders: "Content-Type,Authorization",
      })
    );
    this.app.use(express.urlencoded({extended: true}));
  }

  // routes configuration
  private routes() {
    this.app.use("/", aasaRouter())
    this.app.use("/api/signin", authRouter());
    this.app.use("/api/event", eventRouter())
    this.app.use("/", voteRouter())
    this.app.use("/api/recommend", aiRouter())
    this.app.use("/api/notification", notificationRouter())
  }

  private swaggerDocs() {
    const swaggerFilePath = path.resolve("public/swagger.json");

    if (!fs.existsSync(swaggerFilePath)) {
      console.warn("⚠️ Swagger JSON not found at", swaggerFilePath);
      return;
    }

    // Serve the raw Swagger file
    this.app.use("/swagger.json", express.static(swaggerFilePath));

    // Mount Swagger UI
    this.app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(undefined, {
        swaggerOptions: {
          url: "/swagger.json", // ✅ Let Swagger UI fetch it dynamically
        },
        customCss: `
          .swagger-ui .topbar { display: none }
          body { margin: 0; background: #fafafa; }
        `,
        customSiteTitle: "Cordy API Docs",
      })
    );

    console.log("📘 Swagger UI available at /api-docs, spec served from /swagger.json");
  }

  // handler configuration
  private handleError() {
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.status(404).send("Not Found !");
    });

    this.app.use(
      (err: Error, req: Request, res: Response, next: NextFunction) => {
        res.status(500).send({
          message: err.message,
        });
      }
    );
  }

  start() {
    this.app.listen(PORT, () => {
      console.log(`Server running on PORT ${PORT}`);
    });
  }
}

export function buildApp(): Application {
  return new App().instance;
}
