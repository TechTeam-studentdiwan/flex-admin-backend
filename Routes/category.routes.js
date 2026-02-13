import { Router } from "express";
import {
    addCategory,
    getCategories,
    updateCategory,
    deleteCategory,
} from "../Controllers/category.controller.js";

const categoryRouter = Router();

categoryRouter.post("/add", addCategory);
categoryRouter.get("/getcatagories", getCategories);
categoryRouter.put("/update/:id", updateCategory);
categoryRouter.delete("/delete/:id", deleteCategory);

export default categoryRouter;
