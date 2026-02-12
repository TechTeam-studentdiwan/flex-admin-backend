
import CartModel from "../Models/cart.model.js";
import UserModel from "../Models/user.model.js";
import ProductModel from "../Models/product.model.js";
import OrderModel from "../Models/order.model.js";
import CouponModel from "../Models/coupon.model.js";

export const createOrder = async (req, res) => {
    try {
        const { userId, shippingAddressId, couponCode } = req.body;

        // 1️⃣ Get cart
        const cart = await CartModel.findOne({ userId });
        if (!cart || !cart.items.length) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        // 2️⃣ Get user
        const user = await UserModel.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const address = user.addresses.find(a => a.id === shippingAddressId);
        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }


        let subtotal = 0;
        let fitFee = 0;
        const orderItems = [];

        for (const item of cart.items) {
            const product = await ProductModel.findOne({ id: item.productId });
            if (!product) continue;

            const price = product.discountPrice || product.price;
            const itemTotal = price * item.quantity;
            subtotal += itemTotal;

            if (item.fitAdjustment) {
                fitFee += (item.fitAdjustment.fee || 0) * item.quantity;
            }

            orderItems.push({
                productId: item.productId,
                productName: product.name,
                productImage: product.images?.[0] || "",
                size: item.size,
                quantity: item.quantity,
                price,
                fitAdjustment: item.fitAdjustment,
            });
        }

        let discount = 0;

        if (couponCode) {
            const now = new Date();

            const coupon = await CouponModel.findOne({
                code: couponCode,
                isActive: true,
            });

            if (coupon && coupon.validFrom <= now && now <= coupon.validTo) {
                if (coupon.type === "percentage") {
                    discount = (subtotal * coupon.value) / 100;
                    if (coupon.maxDiscount) {
                        discount = Math.min(discount, coupon.maxDiscount);
                    }
                } else if (coupon.type === "flat") {
                    discount = coupon.value;
                }
            }
        }


        const deliveryFee = subtotal < 200 ? 15 : 0;
        const total = subtotal - discount + fitFee + deliveryFee;

        let extraDays = 5;
        const hasFitAdjustment = cart.items.some(item => item.fitAdjustment);
        if (hasFitAdjustment) extraDays += 3;

        const estimatedDelivery = new Date(Date.now() + extraDays * 24 * 60 * 60 * 1000);

        const order = await OrderModel.create({
            userId,
            items: orderItems,
            shippingAddress: address,
            subtotal,
            discount,
            fitAdjustmentFee: fitFee,
            deliveryFee,
            total,
            couponCode: couponCode || null,
            orderStatus: hasFitAdjustment ? "fit_adjustment_in_progress" : "processing",
            estimatedDelivery,
        });

        await CartModel.deleteOne({ userId });

        return res.status(200).json({ success: true, order });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};


export const getOrdersbyuserId = async (req, res) => {

    try {
        const orders = await OrderModel.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.status(200).json({ orders });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getOrderDetail = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await OrderModel.findOne({ id: orderId });
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({success:false, message: "Server error" });
    }
};

