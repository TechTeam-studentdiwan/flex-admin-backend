import { Router } from "express";
import { createOrder, getOrderbyId } from "../Controllers/orders.controller.js";

const orderRouter = Router();

orderRouter.post("/create", createOrder);
orderRouter .get("/userId", getOrderbyId);


export default orderRouter ;