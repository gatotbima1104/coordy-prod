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
import swaggerUiDist from "swagger-ui-dist";
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
      console.warn("⚠️ Swagger JSON not found. Did you run `npm run generate-swagger`?");
      return;
    }

    // Serve swagger.json directly
    this.app.use("/swagger.json", express.static(swaggerFilePath));

    // Serve Swagger UI assets manually from swagger-ui-dist
    const swaggerAssetsPath = swaggerUiDist.getAbsoluteFSPath();
    this.app.use("/swagger-ui", express.static(swaggerAssetsPath));

    // Serve index.html manually
    this.app.get("/api-docs", (req, res) => {
      const htmlPath = path.join(swaggerAssetsPath, "index.html");
      let html = fs.readFileSync(htmlPath, "utf8");

      // Replace default URL with our JSON
      html = html.replace(
        'https://petstore.swagger.io/v2/swagger.json',
        "/swagger.json"
      );

      res.send(html);
    });

    console.log("📘 Swagger UI available at /api-docs, serving static assets from /swagger-ui");
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
