import express, { Application, Request, Response, NextFunction } from "express";
import { PORT } from "./configs/config";
import cors from "cors";
import { authRouter } from "./routes/auth.route";
import { eventRouter } from "./routes/event.route";
import { voteRouter } from "./routes/vote.route";
import { swaggerSpec, swaggerUi } from "./configs/swagger.config";
import { aasaRouter } from "./routes/aasa.route";
import { aiRouter } from "./routes/ai.route";
import { notificationRouter } from "./routes/notification.route";

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
    this.app.use("/vote", voteRouter())
    this.app.use("/api/recommend", aiRouter())
    this.app.use("/api/notification", notificationRouter())
  }

  private swaggerDocs() {
    this.app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log(`📘 Swagger docs available at http://localhost:${PORT}/api-docs`);
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
