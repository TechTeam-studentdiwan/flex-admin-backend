import { Router } from "express";
import { addtoWishlist, getWishlist, removefromWishlist } from "../Controllers/wishlist.controller.js";

const wishlistRouter = Router();

wishlistRouter.post("/add", addtoWishlist);
wishlistRouter.delete("/remove/:id", removefromWishlist);
wishlistRouter.get("/get", getWishlist);


export default wishlistRouter;