import { Router } from "express";
import { getCoupons, validateCoupon } from "../Controllers/coupon.controller.js";

const couponRouter = Router();

couponRouter.get("/get-coupons", getCoupons);
couponRouter .post("/validate", validateCoupon);


export default couponRouter ;