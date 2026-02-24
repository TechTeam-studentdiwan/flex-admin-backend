import OfferModel from "../Models/OfferModel.js";


export const createOffer = async (req, res) => {
  try {
    const { image, link, position } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    const offer = await OfferModel.create({
      image,
      link,
      position,
    });

    return res.status(201).json({
      success: true,
      message: "Offer created successfully",
      offer,
    });
  } catch (error) {
    console.error("Create offer error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating offer",
    });
  }
};

export const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedOffer = await OfferModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedOffer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Offer updated successfully",
      offer: updatedOffer,
    });
  } catch (error) {
    console.error("Update offer error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating offer",
    });
  }
};

export const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const offer = await OfferModel.findByIdAndDelete(id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Offer deleted successfully",
    });
  } catch (error) {
    console.error("Delete offer error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting offer",
    });
  }
};

export const getAllOffers = async (req, res) => {
  try {
    const offers = await OfferModel.find()
      .sort({ position: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: offers.length,
      offers,
    });
  } catch (error) {
    console.error("Fetch offers error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching offers",
    });
  }
};
