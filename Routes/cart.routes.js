import { Router } from "express";
import { addCart, getCart } from "../Controllers/cart.controller.js";
const cartRouter = Router();

cartRouter.get("/:userId", getCart);
cartRouter.post("/guest", addCart);


export default cartRouter;