import mongoose from "mongoose";

const MeasurementGuideStepSchema = new mongoose.Schema(
  {
    stepNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const MeasurementGuideStepModel =
  mongoose.models.MeasurementGuideStep ||
  mongoose.model("MeasurementGuideStep", MeasurementGuideStepSchema);

export default MeasurementGuideStepModel;
