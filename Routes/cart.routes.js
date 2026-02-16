import { Router } from "express";
import { addCart, getCart, updateCart, removeFromCart } from "../Controllers/cart.controller.js";
import { authentication } from "../Middlewares/authentication.js";
const cartRouter = Router();

cartRouter.get("/:userId", authentication, getCart);
cartRouter.post("/add-cart", authentication, addCart);
cartRouter.put("/update", authentication, updateCart);
cartRouter.delete("/remove", authentication, removeFromCart);


export default cartRouter;