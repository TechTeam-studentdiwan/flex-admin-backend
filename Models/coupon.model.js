import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
  name: String,
  image: String,
  order: Number,
});

const CouponModel = mongoose.model("Category", CategorySchema);
export default CouponModel;
