import { Router } from "express";
import { authContext } from "../middleware/authContext.ts";
import { brandPillarsController } from "../controllers/brandPillarsController.ts";
import { ideasController } from "../controllers/ideasController.ts";
import { draftsController } from "../controllers/draftsController.ts";
import { slidesController } from "../controllers/slidesController.ts";
import { accountsController } from "../controllers/accountsController.ts";

export const apiRouter = Router();

// Apply authContext middleware to all API routes
apiRouter.use(authContext);

// Account context verification endpoint
apiRouter.get("/accounts/me", accountsController.getCurrent);
apiRouter.get("/accounts", accountsController.listAll);

// Brand Pillars CRUD (Fase 1 & Fase 3)
apiRouter.get("/brand-pillars", brandPillarsController.list);
apiRouter.get("/brand-pillars/:id", brandPillarsController.getById);
apiRouter.post("/brand-pillars", brandPillarsController.create);
apiRouter.put("/brand-pillars/:id", brandPillarsController.update);
apiRouter.patch("/brand-pillars/:id", brandPillarsController.update);
apiRouter.delete("/brand-pillars/:id", brandPillarsController.delete);

// Ideas CRUD (Fase 1 & Fase 3)
apiRouter.get("/ideas", ideasController.list);
apiRouter.get("/ideas/:id", ideasController.getById);
apiRouter.post("/ideas", ideasController.create);
apiRouter.put("/ideas/:id", ideasController.update);
apiRouter.patch("/ideas/:id", ideasController.update);
apiRouter.delete("/ideas/:id", ideasController.delete);

// Drafts CRUD (Fase 1 & Fase 3)
apiRouter.get("/drafts", draftsController.list);
apiRouter.get("/drafts/:id", draftsController.getById);
apiRouter.post("/drafts", draftsController.create);
apiRouter.put("/drafts/:id", draftsController.update);
apiRouter.patch("/drafts/:id", draftsController.update);
apiRouter.delete("/drafts/:id", draftsController.delete);

// Slides CRUD (Fase 1 & Fase 3)
apiRouter.get("/slides", slidesController.list);
apiRouter.get("/slides/:id", slidesController.getById);
apiRouter.post("/slides", slidesController.create);
apiRouter.put("/slides/:id", slidesController.update);
apiRouter.patch("/slides/:id", slidesController.update);
apiRouter.delete("/slides/:id", slidesController.delete);

export default apiRouter;
