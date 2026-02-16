import mongoose from "mongoose";

const CartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  size: String,
  quantity: { type: Number, default: 1 },
  fitAdjustment: Object,
});

const CartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [CartItemSchema],
}, { timestamps: true });

const CartModel = mongoose.models.Cart || mongoose.model("Cart", CartSchema);
export default CartModel;
