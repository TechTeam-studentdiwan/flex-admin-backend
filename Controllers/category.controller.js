import CategoryModel from "../Models/category.model.js";

export const addCategory = async (req, res) => {
  try {
    const { name, image, order } = req.body;

    if (!name || order === undefined) {
      return res.status(400).json({ message: "Name and order are required" });
    }

    const exists = await CategoryModel.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await CategoryModel.create({
      name,
      image: image || "",
      order,
    });

    return res.json({ success: true, category, message: "Category added" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await CategoryModel.find().sort({ order: 1 }).limit(100);
    return res.json({ categories });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image, order } = req.body;

    const category = await CategoryModel.findOne({ id });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (name !== undefined) category.name = name;
    if (image !== undefined) category.image = image;
    if (order !== undefined) category.order = order;

    await category.save();

    return res.json({ success: true, category, message: "Category updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};


export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await CategoryModel.findOneAndDelete({ id });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
