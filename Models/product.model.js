import mongoose from "mongoose";

const SizeChartSchema = new mongoose.Schema(
  {
    size: { type: String, required: true },// e.g. "S", "M", "L", "XL"
    bust_max: { type: Number, required: true },
    waist_max: { type: Number, required: true },
    hips_max: { type: Number, required: true },
    shoulder_max: { type: Number, required: true },
    sleeve_length: { type: Number },
    dress_length: { type: Number },
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
    fitAdjustmentFee: Number,
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
    estimatedDeliveryDays: Number,
    codAvailable: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const ProductModel =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);

export default ProductModel;
