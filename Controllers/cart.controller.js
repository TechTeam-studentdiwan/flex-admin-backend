
import CartModel from "../Models/cart.model.js";
import ProductModel from "../Models/product.model.js";


export const getCart = async (req, res) => {

    try {
        const userId = req.params.userId;
        if (!userId) return res.status(400).json({ success: false, message: "UserId Required" });
        const cart = await CartModel.findOne({ userId });
        if (!cart) return res.json({ items: [], total: 0 });

        let total = 0;
        const items = [];

        for (const item of cart.items) {
            const product = await ProductModel.findById(item.productId);
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
                _id:item._id,
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
        const { userId, productId, size, quantity = 1, fitAdjustment, paymentType } = req.body;
        if (!userId) return res.status(400).json({ success: false, message: "UserId Required" });

        // ── Stock validation ──────────────────────────────────────────
        const product = await ProductModel.findById(productId);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });
        if (!product.isActive) return res.status(400).json({ success: false, message: "Product is no longer available" });

        // Per-size stock takes priority; fall back to global stock
        const hasSizeStock = product.sizeStock && product.sizeStock.has(size);
        const availableStock = hasSizeStock
            ? (product.sizeStock.get(size) ?? 0)
            : (product.stock ?? 0);

        // Account for what's already in the cart for this product+size
        const existingCart = await CartModel.findOne({ userId });
        const existingItem = existingCart?.items.find(
            i => i.productId.toString() === productId.toString() && i.size === size
        );
        const alreadyInCart = existingItem ? existingItem.quantity : 0;

        if (alreadyInCart + quantity > availableStock) {
            const remaining = Math.max(0, availableStock - alreadyInCart);
            return res.status(400).json({
                success: false,
                message: remaining > 0
                    ? `Only ${remaining} unit${remaining !== 1 ? "s" : ""} left for size ${size}`
                    : `Size ${size} is out of stock`,
                availableStock,
                alreadyInCart,
            });
        }
        // ─────────────────────────────────────────────────────────────

        let cart = existingCart;
        if (!cart) {
            await CartModel.create({
                userId,
                items: [{ productId, size, quantity, fitAdjustment, paymentType }],
            });
        } else {
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.items.push({ productId, size, quantity, fitAdjustment, paymentType });
            }
            cart.updatedAt = new Date();
            await cart.save();
        }

        res.status(200).json({ success: true, message: "Added to cart", availableStock });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const updateCart = async (req, res) => {
    try {
        const { userId, itemId, quantity } = req.body || {};

        const cart = await CartModel.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        const item = cart.items.find(i => i._id.toString() === itemId.toString());
        if (!item) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        const product = await ProductModel.findById(item.productId);
        if (product) {
            const hasSizeStock = product.sizeStock && product.sizeStock.has(item.size);
            const availableStock = hasSizeStock
                ? (product.sizeStock.get(item.size) ?? 0)
                : (product.stock ?? 0);

            if (quantity > availableStock) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${availableStock} unit${availableStock !== 1 ? "s" : ""} available for size ${item.size}`,
                    availableStock,
                });
            }
        }

        item.quantity = quantity;
        await cart.save();

        res.json({ success: true, message: "Cart updated" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


export const removeFromCart = async (req, res) => {
    try {
        const { userId, itemId, size } = req.body;

        const cart = await CartModel.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const initialLength = cart.items.length;

        cart.items = cart.items.filter(
            (item) => !(item._id.toString() === itemId.toString() )
        );

        if (cart.items.length === initialLength) {
            return res.status(404).json({ success: false, message: "Item not found in cart" });
        }

        await cart.save();

        return res.json({ success: true, message: "Item removed from cart" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

