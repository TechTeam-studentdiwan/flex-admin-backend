import { Router } from "express";
import { createOrder, getOrdersbyuserId ,getOrderDetail} from "../Controllers/orders.controller.js";

const orderRouter = Router();

orderRouter.post("/create", createOrder);
orderRouter .get("/:userId", getOrdersbyuserId);
orderRouter .get("/:orderId", getOrderDetail);


export default orderRouter ;