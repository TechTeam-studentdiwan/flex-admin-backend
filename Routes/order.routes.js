import { Router } from "express";
import { createOrder, getOrdersbyuserId, getOrderDetail, getAllOrders, updateOrderByAdmin, previewOrder } from "../Controllers/orders.controller.js";
import { authentication } from "../Middlewares/authentication.js";
import { adminOnly } from "../Middlewares/admin.js";

const orderRouter = Router();

orderRouter.post("/create", authentication, createOrder);
orderRouter.post("/update/:orderId", authentication, adminOnly, updateOrderByAdmin);
orderRouter.get("/getordersbyuser/:userId", authentication, getOrdersbyuserId);
orderRouter.get("/getorderdetails/:orderId", authentication, getOrderDetail);
orderRouter.get("/getallorders", authentication, adminOnly, getAllOrders);
orderRouter.post("/preview", authentication, previewOrder);


export default orderRouter;