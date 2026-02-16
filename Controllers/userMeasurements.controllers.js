import UserModel from "../Models/user.model.js";
import ProductModel from "../Models/product.model.js";



export const getUserMeasurement = async (req, res) => {

    const id = req.params.userId;
    try {
        const user = await UserModel.findById(id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        res.json({ success: true, profiles: user.measurementProfiles || [] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const addUserMeasurement = async (req, res) => {

    try {
           console.log(req.body)
        const { userId, profile } = req?.body;
     
        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.measurementProfiles.push(profile);
        await user.save();

        res.json({ success: true, message: "Profile added", profile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const validateMeasurement = async (req, res) => {

    try {
        const { productId, selectedSize, profileId } = req.body;

        const product = await ProductModel.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });

        const user = await UserModel.findOne({ "measurementProfiles.id": profileId });
        if (!user) return res.status(404).json({ message: "User not found" });

        const profile = user.measurementProfiles.find(p => p.id === profileId);
        if (!profile) return res.status(404).json({ message: "Profile not found" });

        if (!product.fitAdjustmentEnabled || !product.sizeChart) {
            return res.json({ eligible: false, message: "Fit adjustment not available" });
        }

        const sizeChart = product.sizeChart[selectedSize];
        if (!sizeChart) {
            return res.json({ eligible: false, message: "Size chart not available" });
        }

        const m = profile.measurements;
        const reasons = [];

        if (m.bust > sizeChart.bust_max) reasons.push("bust");
        if (m.waist > sizeChart.waist_max) reasons.push("waist");
        if (m.hips > sizeChart.hips_max) reasons.push("hips");
        if (m.shoulder > sizeChart.shoulder_max) reasons.push("shoulder");

        if (reasons.length) {
            return res.json({
                eligible: false,
                reasons,
                message: `These measurements exceed the selected size (${reasons.join(", ")}).`,
            });
        }

        res.json({
            eligible: true,
            fee: 30,
            extraDays: 3,
            adjustments: ["length", "sleeve", "waist"],
            profileName: profile.profileName,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


