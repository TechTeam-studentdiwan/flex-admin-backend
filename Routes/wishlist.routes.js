import { Router } from "express";
import { addtoWishlist, getWishlist, removefromWishlist } from "../Controllers/wishlist.controller.js";
import { authentication } from "../Middlewares/authentication.js";

const wishlistRouter = Router();

wishlistRouter.post("/add", authentication, addtoWishlist);
wishlistRouter.delete("/remove/:id", authentication, removefromWishlist);
wishlistRouter.get("/get", authentication, getWishlist);


export default wishlistRouter;