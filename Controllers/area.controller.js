import AreaModel from "../Models/area.model.js";

export const getAllAreas = async (req, res) => {
  try {
    const areas = await AreaModel.find().sort({ name: 1 });
    res.status(200).json({ success: true, areas });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
}; 

export const createArea = async (req, res) => {
  try {
    const { name, deliveryFee } = req.body;
    if (!name || deliveryFee === undefined) {
      return res.status(400).json({ message: "name and deliveryFee are required" });
    }
    const area = await AreaModel.create({ name, deliveryFee });
    res.status(201).json({ success: true, area });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, deliveryFee, isActive } = req.body;
    const area = await AreaModel.findByIdAndUpdate(
      id,
      { ...(name !== undefined && { name }), ...(deliveryFee !== undefined && { deliveryFee }), ...(isActive !== undefined && { isActive }) },
      { new: true, runValidators: true }
    );
    if (!area) return res.status(404).json({ message: "Area not found" });
    res.status(200).json({ success: true, area });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteArea = async (req, res) => {
  try {
    const { id } = req.params;
    await AreaModel.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Area deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
