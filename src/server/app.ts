import express from "express";
import { apiRouter } from "./routes/apiRouter.ts";

export function createExpressApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Unprotected health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "multi-tenant-content-engine",
    });
  });

  // Mount scoped multi-tenant API
  app.use("/api", apiRouter);

  return app;
}

export const expressApp = createExpressApp();
export default expressApp;
