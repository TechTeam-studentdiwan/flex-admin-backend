import MeasurementGuideStepModel from "../Models/measurementGuide.model.js";

export const getGuideSteps = async (req, res) => {
  try {
    const steps = await MeasurementGuideStepModel.find({ isActive: true }).sort({ stepNumber: 1 });
    res.json({ success: true, steps });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllGuideSteps = async (req, res) => {
  try {
    const steps = await MeasurementGuideStepModel.find().sort({ stepNumber: 1 });
    res.json({ success: true, steps });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createGuideStep = async (req, res) => {
  try {
    const { stepNumber, title, description, imageUrl, isActive } = req.body;
    if (!stepNumber || !title || !description) {
      return res.status(400).json({ message: "stepNumber, title and description are required" });
    }
    const step = await MeasurementGuideStepModel.create({ stepNumber, title, description, imageUrl, isActive });
    res.status(201).json({ success: true, step });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateGuideStep = async (req, res) => {
  try {
    const { id } = req.params;
    const step = await MeasurementGuideStepModel.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!step) return res.status(404).json({ message: "Step not found" });
    res.json({ success: true, step });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteGuideStep = async (req, res) => {
  try {
    const { id } = req.params;
    await MeasurementGuideStepModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Step deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
