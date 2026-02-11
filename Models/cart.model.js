import mongoose from "mongoose";

const CartItemSchema = new mongoose.Schema({
  productId: String,
  size: String,
  quantity: { type: Number, default: 1 },
  fitAdjustment: Object,
});

const CartSchema = new mongoose.Schema({
  userId: String,
  items: [CartItemSchema],
  updatedAt: { type: Date, default: Date.now },
});

const CartModel = mongoose.model("Cart", CartSchema);
export default CartModel;
