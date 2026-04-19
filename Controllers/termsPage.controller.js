import TermsPageModel from "../Models/termsPage.model.js";

export const getAllTermsPages = async (req, res) => {
  try {
    const pages = await TermsPageModel.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
    res.status(200).json({ success: true, pages });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllTermsPagesAdmin = async (req, res) => {
  try {
    const pages = await TermsPageModel.find().sort({ order: 1, createdAt: 1 });
    res.status(200).json({ success: true, pages });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getTermsPageById = async (req, res) => {
  try {
    const page = await TermsPageModel.findById(req.params.id);
    if (!page) return res.status(404).json({ message: "Page not found" });
    res.status(200).json({ success: true, page });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createTermsPage = async (req, res) => {
  try {
    const { title, content, order, isActive } = req.body;
    if (!title || !content) return res.status(400).json({ message: "title and content are required" });
    const page = await TermsPageModel.create({ title, content, order: order || 0, isActive: isActive !== false });
    res.status(201).json({ success: true, page });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateTermsPage = async (req, res) => {
  try {
    const { title, content, order, isActive } = req.body;
    const page = await TermsPageModel.findByIdAndUpdate(
      req.params.id,
      { ...(title !== undefined && { title }), ...(content !== undefined && { content }), ...(order !== undefined && { order }), ...(isActive !== undefined && { isActive }) },
      { new: true, runValidators: true }
    );
    if (!page) return res.status(404).json({ message: "Page not found" });
    res.status(200).json({ success: true, page });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteTermsPage = async (req, res) => {
  try {
    await TermsPageModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Page deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
