import { Router } from "express";
import { addUserAddress, getUserAddress } from "../Controllers/userAddress.controller.js";
import { addUserMeasurement, getUserMeasurement, validateMeasurement } from "../Controllers/userMeasurements.controllers.js";
import { authentication } from "../Middlewares/authentication.js";
import { adminOnly } from "../Middlewares/admin.js";
import { updateUserProfile, getAllUsersByAdmin,getAdminDashboardOverview } from "../Controllers/userDetails.controller.js";

const userRouter = Router();

userRouter.get("/get-address/:userId", authentication, getUserAddress);
userRouter.post("/add-address", authentication, addUserAddress);


userRouter.get("/get-measurements/:userId", authentication, getUserMeasurement);
userRouter.post("/add-measurements", authentication, addUserMeasurement);
userRouter.post("/validate-measurements/:userId", authentication, validateMeasurement);

// USER DETAILS ROUTES
userRouter.put("/update-profile/:userId", authentication, adminOnly, updateUserProfile);
userRouter.get("/get-users", authentication, adminOnly, getAllUsersByAdmin);
userRouter.get("/get-dashboard-overview", authentication, adminOnly, getAdminDashboardOverview);


export default userRouter;