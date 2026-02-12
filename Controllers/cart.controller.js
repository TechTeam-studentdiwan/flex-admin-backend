
import CartModel from "../Models/cart.model.js";
import ProductModel from "../Models/product.model.js";


export const getCart = async (req, res) => {

    try {
        const cart = await CartModel.findOne({ userId: req.params.userId });
        if (!cart) return res.json({ items: [], total: 0 });

        let total = 0;
        const items = [];

        for (const item of cart.items) {
            const product = await ProductModel.findOne({ id: item.productId });
            if (!product) continue;

            const price = product.discountPrice || product.price;
            let itemTotal = price * item.quantity;

            if (item.fitAdjustment) {
                itemTotal += (item.fitAdjustment.fee || 0) * item.quantity;
            }

            items.push({
                productId: item.productId,
                productName: product.name,
                productImage: product.images?.[0] || "",
                price,
                size: item.size,
                quantity: item.quantity,
                fitAdjustment: item.fitAdjustment,
                itemTotal,
            });

            total += itemTotal;
        }

        res.status(200).json({ success: true, items, total });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const addCart = async (req, res) => {

    try {
        const { userId, productId, size, quantity, fitAdjustment } = req.body;

        let cart = await CartModel.findOne({ userId });

        if (!cart) {
            await CartModel.create({
                userId,
                items: [{ productId, size, quantity, fitAdjustment }],
            });
        } else {
            const existing = cart.items.find(i => i.productId === productId && i.size === size);
            if (existing) existing.quantity += quantity;
            else cart.items.push({ productId, size, quantity, fitAdjustment });

            cart.updatedAt = new Date();
            await cart.save();
        }

        res.status(200).json({ success: true, message: "Added to cart" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const updateCart = async (req, res) => {
    try {
        const { userId, productId, size, quantity } = req.body;

        const cart = await CartModel.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        const item = cart.items.find(i => i.productId === productId && i.size === size);
        if (!item) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        item.quantity = quantity; // 👈 SET, not add

        cart.updatedAt = new Date();
        await cart.save();

        res.json({ success: true, message: "Cart updated" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


export const removeFromCart = async (req, res) => {
    try {
        const { userId, productId, size } = req.body;

        const cart = await CartModel.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const initialLength = cart.items.length;

        cart.items = cart.items.filter(
            (item) => !(item.productId === productId && item.size === size)
        );

        if (cart.items.length === initialLength) {
            return res.status(404).json({ success: false, message: "Item not found in cart" });
        }

        cart.updatedAt = new Date();
        await cart.save();

        return res.json({ success: true, message: "Item removed from cart" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

