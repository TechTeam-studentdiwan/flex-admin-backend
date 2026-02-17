import { Router } from "express";
import { guestUser, loginUser, registerUser, updateUserProfile } from "../Controllers/auth.controller.js";
import { authentication } from "../Middlewares/authentication.js";
import { adminOnly } from "../Middlewares/admin.js";
const authRouter = Router();

authRouter.post("/register", registerUser);

authRouter.post("/login", loginUser);
authRouter.post("/guest", guestUser);

authRouter.put("/update-profile/:userId", authentication, adminOnly, updateUserProfile);


export default authRouter;