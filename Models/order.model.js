import mongoose from "mongoose";

// Snapshot of shipping address at order time
const ShippingAddressSchema = new mongoose.Schema(
    {
        label: { type: String, trim: true },
        fullName: { type: String, trim: true, required: true },
        phone: { type: String, trim: true, required: true },
        addressLine1: { type: String, trim: true, required: true },
        addressLine2: { type: String, trim: true },
        city: { type: String, trim: true, required: true },
        state: { type: String, trim: true },
        postalCode: { type: String, trim: true, required: true },
        country: { type: String, default: "Qatar" },
    },
    { _id: false }
);

const OrderItemSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        image: { type: String },
        size: { type: String }, // e.g. "M", "L"
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        discountPrice: { type: Number, default: 0 },
        fitAdjustment: { type: Object },
        fitAdjustmentFee: { type: Number, default: 0 },
    },
    { _id: false }
);

const OrderSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
        orderNumber: { type: String, unique: true, index: true },
        items: {
            type: [OrderItemSchema],
            required: true,
        },
        shippingAddress: {
            type: ShippingAddressSchema,
            required: true,
        },

        subtotal: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        fitAdjustmentFee: { type: Number, default: 0 },
        deliveryFee: { type: Number, default: 0 },
        total: { type: Number, required: true },

        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed", "refunded"],
            default: "pending",
        },
        paymentReferenceId: {
            type: String,

            default: "N/A",
        },

        orderStatus: {
            type: String,
            default: "pending",
        },

        couponCode: { type: String },
        trackingNumber: { type: String },
        estimatedDelivery: { type: Date },
    },
    { timestamps: true }
);

const OrderModel = mongoose.models.Order || mongoose.model("Order", OrderSchema);
export default OrderModel;
