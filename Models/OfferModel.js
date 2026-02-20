import mongoose from "mongoose";

const OfferSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    subtitle: {
      type: String,
      trim: true,
    },

    link: {
      type: String,
      trim: true,
    },

    position: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const OfferModel = mongoose.model("Offer", OfferSchema);

export default OfferModel;
