import { Router } from "express";
import { getAllAreas, createArea, updateArea, deleteArea } from "../Controllers/area.controller.js";
import { authentication } from "../Middlewares/authentication.js";
import { adminOnly } from "../Middlewares/admin.js";

const areaRouter = Router();

areaRouter.get("/all", getAllAreas);
areaRouter.post("/create", authentication, adminOnly, createArea);
areaRouter.put("/update/:id", authentication, adminOnly, updateArea);
areaRouter.delete("/delete/:id", authentication, adminOnly, deleteArea);

export default areaRouter;
