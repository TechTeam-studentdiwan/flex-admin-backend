import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ["percentage", "flat", "freedelivery"], required: true },
  value: { type: Number, required: true },
  minCartValue: { type: Number, default: 0 },
  maxDiscount: Number,
  validFrom: { type: Date, required: true },
  validTo: { type: Date, required: true },
  usageLimit: { type: Number, default: 1000 },
  usedCount: { type: Number, default: 0 },
  eligibleCategories: [String],
  firstOrderOnly: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const CouponModel =
  mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);

export default CouponModel;
