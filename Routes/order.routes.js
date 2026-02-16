import { Router } from "express";
import { createOrder, getOrdersbyuserId, getOrderDetail, getAllOrders } from "../Controllers/orders.controller.js";
import { authentication } from "../Middlewares/authentication.js";
import { adminOnly } from "../Middlewares/admin.js";

const orderRouter = Router();

orderRouter.post("/create", authentication, createOrder);
orderRouter.get("/getordersbyuser/:userId", authentication, getOrdersbyuserId);
orderRouter.get("/getorderdetails/:orderId", authentication, getOrderDetail);
orderRouter.get("/getallorders", authentication, adminOnly, getAllOrders);


export default orderRouter;