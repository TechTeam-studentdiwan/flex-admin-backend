import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, default: "" },
  order: { type: Number, required: true },
});

const CategoryModel =
  mongoose.models.Category || mongoose.model("Category", CategorySchema);

export default CategoryModel;
