import { Router } from "express";
import {
    getCoupons,
    validateCoupon,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    getMyVouchers,
    assignVoucher,
} from "../Controllers/coupon.controller.js";
import { authentication } from "../Middlewares/authentication.js";
import { adminOnly } from "../Middlewares/admin.js";

const couponRouter = Router();

couponRouter.get("/get-coupons", authentication, getCoupons);
couponRouter.post("/validate", authentication, validateCoupon);
couponRouter.post("/create", authentication, adminOnly, createCoupon);
couponRouter.put("/update/:id", authentication, adminOnly, updateCoupon);
couponRouter.delete("/delete/:id", authentication, adminOnly, deleteCoupon);
couponRouter.get("/my-vouchers/:userId", authentication, getMyVouchers);
couponRouter.post("/assign", authentication, adminOnly, assignVoucher);

export default couponRouter;