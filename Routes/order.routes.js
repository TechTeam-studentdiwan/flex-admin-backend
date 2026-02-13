import { Router } from "express";
import { createOrder, getOrdersbyuserId, getOrderDetail } from "../Controllers/orders.controller.js";
import { authentication } from "../Middlewares/authentication.js";

const orderRouter = Router();

orderRouter.post("/create", authentication, createOrder);
orderRouter.get("/getordersbyuser/:userId", authentication, getOrdersbyuserId);
orderRouter.get("/getorderdetails/:orderId", authentication, getOrderDetail);


export default orderRouter;