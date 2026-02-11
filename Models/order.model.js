import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const OrderSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4 },
    userId: String,
    orderNumber: String,
    items: Array,
    shippingAddress: Object,
    subtotal: Number,
    discount: Number,
    fitAdjustmentFee: Number,
    deliveryFee: Number,
    total: Number,
    paymentStatus: { type: String, default: "pending" },
    orderStatus: String,
    couponCode: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    createdAt: { type: Date, default: Date.now },
});

const OrderModel = mongoose.model("Order", OrderSchema);
export default OrderModel;
