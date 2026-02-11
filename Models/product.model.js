import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const ProductSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4 },
  name: String,
  description: String,
  price: Number,
  discountPrice: Number,
  category: String,
  subcategory: String,
  images: [String],
  sizes: [String],
  fitAdjustmentEnabled: Boolean,
  sizeChart: Object,
  stock: Number,
  fabric: String,
  occasion: String,
  tags: [String],
  whatsIncluded: { type: String, default: "2pc set" },
  careInstructions: { type: String, default: "Dry clean recommended" },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const ProductModel = mongoose.model("Product", ProductSchema);
export default ProductModel;
