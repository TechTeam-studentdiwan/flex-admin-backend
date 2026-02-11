import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const CategorySchema = new mongoose.Schema({
  id: { type: String, default: uuidv4 },
  name: String,
  image: String,
  order: Number,
});

const CategoryModel = mongoose.model("Category", CategorySchema);
export default CategoryModel;
