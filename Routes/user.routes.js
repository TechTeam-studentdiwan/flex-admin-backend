import { Router } from "express";
import { addUserAddress, getUserAddress } from "../Controllers/userAddress.controller.js";
import { addUserMeasurement, getUserMeasurement, validateMeasurement } from "../Controllers/userMeasurements.controllers.js";
import { authentication } from "../Middlewares/authentication.js";

const userRouter = Router();

userRouter.get("/get-address/:userId", authentication, getUserAddress);
userRouter.post("/add-address/:userId", authentication, addUserAddress);


userRouter.get("/get-measurements/:userId", authentication, getUserMeasurement);
userRouter.post("/add-measurements/:userId", authentication, addUserMeasurement);
userRouter.post("/validate-measurements/:userId", authentication, validateMeasurement);


export default userRouter;