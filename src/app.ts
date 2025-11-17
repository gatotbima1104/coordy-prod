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
import swaggerUiDist from "swagger-ui-dist";
import cors from "cors";
// import swaggerUi from "swagger-ui-express";

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

  private sharePreviewHandler = (req: Request, res: Response) => {
    const ua = (req.headers['user-agent'] || "").toLowerCase();
    const isPreviewBot =
      ua.includes("facebookexternalhit") ||
      ua.includes("whatsapp") ||
      ua.includes("twitterbot") ||
      ua.includes("slackbot") ||
      ua.includes("imessage") ||
      ua.includes("fetch") || 
      ua.includes("preview");

    const { e, i } = req.query;

    if (isPreviewBot) {
      const title = "Respond to your Coordiy Event";
      const desc = "Tap to choose your available time instantly.";
      const image = "https://coordiy.app/App_Clip_Preview.jpg";

      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="og:title" content="${title}" />
            <meta property="og:description" content="${desc}" />
            <meta property="og:image" content="${image}" />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
          </head>
          <body></body>
        </html>
      `);
    }

    const appClipUrl =
      `https://appclip.apple.com/id?p=com.mario-panApp.Coordiy.Clip` +
      (e && i ? `&e=${e}&i=${i}` : "");

    return res.redirect(appClipUrl);
  };

  // routes configuration
  private routes() {
    this.app.use("/", this.sharePreviewHandler)
    this.app.use("/", aasaRouter())
    this.app.use("/api/signin", authRouter());
    this.app.use("/api/event", eventRouter())
    this.app.use("/", voteRouter())
    this.app.use("/api/recommend", aiRouter())
    this.app.use("/api/notification", notificationRouter())
  }

  // Deployment of Swagger UI
  private swaggerDocs() {
    const swaggerFilePath = path.resolve("public/swagger.json");

    if (!fs.existsSync(swaggerFilePath)) {
      console.warn("⚠️ Swagger JSON not found at", swaggerFilePath);
      return;
    }

    // ✅ Serve your generated swagger.json
    this.app.use("/swagger.json", express.static(swaggerFilePath));

    // ✅ Serve Swagger UI static files (CSS, JS, etc.)
    const swaggerDistPath = swaggerUiDist.getAbsoluteFSPath();

    // ✅ Override swagger-initializer.js to load your spec instead of Petstore
    this.app.get("/api-docs/swagger-initializer.js", (_req, res) => {
      res.type("application/javascript").send(`
        window.onload = function() {
          const ui = SwaggerUIBundle({
            url: '/swagger.json',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
            layout: "StandaloneLayout",
          });
          window.ui = ui;
        };
      `);
    });

    // ✅ Serve remaining Swagger UI assets
    this.app.use("/api-docs", express.static(swaggerDistPath));

    // ✅ Serve customized index.html (title + style tweaks)
    this.app.get(["/api-docs", "/api-docs/"], (req, res) => {
      const indexPath = path.join(swaggerDistPath, "index.html");
      let html = fs.readFileSync(indexPath, "utf8");

      // Optional: change the title and hide the topbar
      html = html.replace(
        "<title>Swagger UI</title>",
        "<title>Cordy API Docs</title><style>.topbar{display:none}</style>"
      );

      res.send(html);
    });

    console.log("📘 Swagger UI available at /api-docs (loads /swagger.json by default)");
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
