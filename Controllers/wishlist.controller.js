import UserModel from "../Models/user.model.js";
import ProductModel from "../Models/product.model.js";


export const addtoWishlist = async (req, res) => {

    try {
        const { userId, productId } = req.body || {};

        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.wishlist.includes(productId)) {
            user.wishlist.push(productId);
            await user.save();
        }

        res.json({ success: true, message: "Added to wishlist" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const removefromWishlist = async (req, res) => {

    try {
        const { userId, productId } = req?.body;
        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
        await user.save();

        res.json({ success: true, message: "Removed from wishlist" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const getWishlist = async (req, res) => {

    const id = req?.params?.userId;
    try {
        const user = await UserModel.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const products = await ProductModel.find({ _id: { $in: user.wishlist } });
        res.json({ products });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};


