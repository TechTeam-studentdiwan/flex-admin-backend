import { Router } from "express";
import { addCart, getCart, updateCart, removeFromCart } from "../Controllers/cart.controller.js";
const cartRouter = Router();

cartRouter.get("/:userId", getCart);
cartRouter.post("/add-cart", addCart);
cartRouter.post("/update", updateCart);
cartRouter.post("/remove", removeFromCart);


export default cartRouter;