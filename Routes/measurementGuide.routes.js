import { Router } from "express";
import {
  getGuideSteps,
  getAllGuideSteps,
  createGuideStep,
  updateGuideStep,
  deleteGuideStep,
} from "../Controllers/measurementGuide.controller.js";
import { authentication } from "../Middlewares/authentication.js";
import { adminOnly } from "../Middlewares/admin.js";

const measurementGuideRouter = Router();

measurementGuideRouter.get("/steps", getGuideSteps);
measurementGuideRouter.get("/steps/all", authentication, adminOnly, getAllGuideSteps);
measurementGuideRouter.post("/steps", authentication, adminOnly, createGuideStep);
measurementGuideRouter.put("/steps/:id", authentication, adminOnly, updateGuideStep);
measurementGuideRouter.delete("/steps/:id", authentication, adminOnly, deleteGuideStep);

export default measurementGuideRouter;
