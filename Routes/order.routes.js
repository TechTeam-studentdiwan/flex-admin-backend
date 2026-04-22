import { Router } from "express";
import { createOrder, buyNowOrder, previewBuyNow, getOrdersbyuserId, getOrderDetail, getAllOrders, updateOrderByAdmin, previewOrder, createPaymentURL, paymentVerify, publicTrackOrder } from "../Controllers/orders.controller.js";
import { authentication } from "../Middlewares/authentication.js";
import { adminOnly } from "../Middlewares/admin.js";

const orderRouter = Router();

orderRouter.get("/track/:orderNumber", publicTrackOrder);

orderRouter.post("/create", authentication, createOrder);
orderRouter.post("/buy-now", authentication, buyNowOrder);
orderRouter.post("/preview-buy-now", authentication, previewBuyNow);
orderRouter.post("/update/:orderId", authentication, adminOnly, updateOrderByAdmin);
orderRouter.post("/payment/link", authentication, createPaymentURL);
orderRouter.get("/getordersbyuser/:userId", authentication, getOrdersbyuserId);
orderRouter.get("/getorderdetails/:orderId", authentication, getOrderDetail);
orderRouter.get("/getallorders", authentication, adminOnly, getAllOrders);
orderRouter.post("/preview", authentication, previewOrder);


orderRouter.post("/payment/verify", authentication,paymentVerify);




export default orderRouter;