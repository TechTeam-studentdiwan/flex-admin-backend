import mongoose from "mongoose";

const TermsPageSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },
    content: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const TermsPageModel = mongoose.model("TermsPage", TermsPageSchema);
export default TermsPageModel;
