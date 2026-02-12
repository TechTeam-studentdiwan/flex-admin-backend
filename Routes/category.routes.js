import { Router } from "express";
import {
    addCategory,
    getCategories,
    updateCategory,
    deleteCategory,
} from "../Controllers/category.controller.js";

const categoryRouter = Router();

categoryRouter.post("/add", addCategory);
categoryRouter.get("/", getCategories);
categoryRouter.put("/:id", updateCategory);
categoryRouter.delete("/:id", deleteCategory);

export default categoryRouter;
