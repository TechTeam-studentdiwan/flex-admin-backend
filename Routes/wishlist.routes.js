import { Router } from "express";
import { addtoWishlist, getWishlist, removefromWishlist } from "../Controllers/wishlist.controller.js";
import { authentication } from "../Middlewares/authentication.js";

const wishlistRouter = Router();

wishlistRouter.post("/add", authentication, addtoWishlist);
wishlistRouter.delete("/remove", authentication, removefromWishlist);
wishlistRouter.get("/get/:userId", authentication, getWishlist);


export default wishlistRouter;