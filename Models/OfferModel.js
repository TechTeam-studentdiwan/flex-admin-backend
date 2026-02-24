import mongoose from "mongoose";

const OfferSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
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
