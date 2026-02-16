import mongoose from "mongoose";

const SizeChartSchema = new mongoose.Schema(
  {
    size: { type: String, required: true },// e.g. "S", "M", "L", "XL"
    bust_max: { type: Number, required: true },
    waist_max: { type: Number, required: true },
    hips_max: { type: Number, required: true },
    shoulder_max: { type: Number, required: true },
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    price: Number,
    discountPrice: Number,
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subcategory: String,
    images: [String],
    sizes: [String],
    fitAdjustmentEnabled: Boolean,
    sizeChart: {
      type: [SizeChartSchema],
      default: [],
    },
    stock: Number,
    fabric: String,
    occasion: String,
    tags: [String],
    whatsIncluded: { type: String, default: "2pc set" },
    careInstructions: { type: String, default: "Dry clean recommended" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ProductModel =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);

export default ProductModel;
