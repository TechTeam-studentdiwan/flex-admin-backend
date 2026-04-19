import mongoose from "mongoose";

const AreaSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    deliveryFee: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const AreaModel = mongoose.model("Area", AreaSchema);
export default AreaModel;
