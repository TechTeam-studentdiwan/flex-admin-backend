import { Router } from "express";
import { guestUser, loginUser, registerUser } from "../Controllers/auth.controller.js";

const authRouter = Router();

authRouter.post("/register", registerUser);

authRouter.post("/login", loginUser);
authRouter.post("/guest", guestUser);




export default authRouter;