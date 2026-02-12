import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const CategorySchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true, index: true },
  name: { type: String, required: true },
  image: { type: String, default: "" },
  order: { type: Number, required: true },
});

// ✅ Prevent OverwriteModelError
const CategoryModel =
  mongoose.models.Category || mongoose.model("Category", CategorySchema);

export default CategoryModel;
