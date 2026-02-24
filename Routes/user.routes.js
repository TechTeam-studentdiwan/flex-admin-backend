import { Router } from "express";
import { addUserAddress, getUserAddress, removeUserAddress } from "../Controllers/userAddress.controller.js";
import { addUserMeasurement, getUserMeasurement, validateMeasurement, removeUserMeasurement } from "../Controllers/userMeasurements.controllers.js";
import { authentication } from "../Middlewares/authentication.js";
import { adminOnly } from "../Middlewares/admin.js";
import { updateUserProfile, getAllUsersByAdmin, getAdminDashboardOverview, getTerms } from "../Controllers/userDetails.controller.js";

const userRouter = Router();
// USER ADDRESS ROUTES
userRouter.get("/get-address/:userId", authentication, getUserAddress);
userRouter.post("/add-address", authentication, addUserAddress);
userRouter.delete("/remove-address", authentication, removeUserAddress);

// USER MEASUREMENT ROUTES
userRouter.get("/get-measurements/:userId", authentication, getUserMeasurement);
userRouter.post("/add-measurements", authentication, addUserMeasurement);
userRouter.post("/validate-measurements/:userId", authentication, validateMeasurement);
userRouter.delete("/measurements/:userId/:profileId", authentication, removeUserMeasurement);

// USER DETAILS ROUTES
userRouter.put("/update-profile/:userId", authentication, adminOnly, updateUserProfile);
userRouter.get("/get-users", authentication, adminOnly, getAllUsersByAdmin);
userRouter.get("/get-dashboard-overview", authentication, adminOnly, getAdminDashboardOverview);


userRouter.get("/terms", authentication, getTerms)


export default userRouter;