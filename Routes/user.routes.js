import { Router } from "express";
import { addUserAddress, getUserAddress } from "../Controllers/userAddress.controller.js";
import { addUserMeasurement, getUserMeasurement, validateMeasurement } from "../Controllers/userMeasurements.controllers.js";

const userRouter = Router();

userRouter.get("/get-address/:userId", getUserAddress);
userRouter.post("/add-address/:userId", addUserAddress);


userRouter.get("/get-measurements/:userId", getUserMeasurement);
userRouter.post("/add-measurements/:userId", addUserMeasurement);
userRouter.post("/validate-measurements/:userId", validateMeasurement);


export default userRouter;