import UserModel from "../Models/user.model.js";
import ProductModel from "../Models/product.model.js";


export const addtoWishlist = async (req, res) => {
    const { userId, productId } = req.body;

    const user = await UserModel.findOne({ id: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.wishlist.includes(productId)) {
        user.wishlist.push(productId);
        await user.save();
    }

    res.json({ success: true, message: "Added to wishlist" });
};

export const removefromWishlist = async (req, res) => {
    const { userId, productId } = req.body;

    const user = await UserModel.findOne({ id: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.wishlist = user.wishlist.filter(id => id !== productId);
    await user.save();

    res.json({ success: true, message: "Removed from wishlist" });
};

export const getWishlist = async (req, res) => {
    const user = await UserModel.findOne({ id: req.params.userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const products = await ProductModel.find({ id: { $in: user.wishlist } });
    res.json({ products });
};


