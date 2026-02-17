import { Router } from "express";
import {
    getProductbyId,
    getProducts,
    addProduct,
    updateProduct,
    deleteProduct,
} from "../Controllers/product.controller.js";
import { authentication } from "../Middlewares/authentication.js";
import { adminOnly } from "../Middlewares/admin.js";

const productRouter = Router();

productRouter.get("/get-products",  getProducts);
productRouter.get("/getbyid/:id",  getProductbyId);
productRouter.post("/add", authentication, adminOnly, addProduct);
productRouter.put("/update/:id", authentication, adminOnly, updateProduct);
productRouter.delete("/delete/:id", authentication, adminOnly, deleteProduct);

export default productRouter;