import { Router } from "express";
import { getProductbyId, getProducts } from "../Controllers/product.controller.js";

const productRouter = Router();

productRouter.get("/get-products", getProducts);
productRouter.get("/getbyid/:userId", getProductbyId);


export default productRouter;