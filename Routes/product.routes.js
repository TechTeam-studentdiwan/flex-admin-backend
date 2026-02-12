import { Router } from "express";
import {
    getProductbyId,
    getProducts,
    addProduct,
    updateProduct,
    deleteProduct,
} from "../Controllers/product.controller.js";

const productRouter = Router();

productRouter.get("/get-products", getProducts);
productRouter.get("/getbyid/:userId", getProductbyId);
productRouter.post("/add", addProduct);    
productRouter.put("/:id", updateProduct);   
productRouter.delete("/:id", deleteProduct);  

export default productRouter;