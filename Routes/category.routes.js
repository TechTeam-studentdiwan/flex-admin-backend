import { Router } from "express";
import {
    addCategory,
    getCategories,
    updateCategory,
    deleteCategory,
} from "../Controllers/category.controller.js";
import { authentication } from "../Middlewares/authentication.js";
import { adminOnly } from "../Middlewares/admin.js";

const categoryRouter = Router();

categoryRouter.post("/add", authentication, adminOnly, addCategory);
categoryRouter.get("/getcatagories", authentication, getCategories);
categoryRouter.put("/update/:id", authentication, adminOnly, updateCategory);
categoryRouter.delete("/delete/:id", authentication, adminOnly, deleteCategory);

export default categoryRouter;
