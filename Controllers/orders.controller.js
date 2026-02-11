
import CartModel from "../Models/cart.model.js";
import ProductModel from "../Models/product.model.js";
import OrderModel from "../Models/order.model.js";
import UserModel from "../Models/user.model.js";



export const createOrder = async (req, res) => {
    const { userId, shippingAddressId, couponCode } = req.body;

    const cart = await CartModel.findOne({ userId });
    if (!cart || !cart.items.length) return res.status(400).json({ message: "Cart is empty" });

    const user = await UserModel.findOne({ id: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const address = user.addresses.find(a => a.id === shippingAddressId);
    if (!address) return res.status(404).json({ message: "Address not found" });

    let subtotal = 0;
    let fitFee = 0;
    const orderItems = [];

    for (const item of cart.items) {
        const product = await ProductModel.findOne({ id: item.productId });
        if (!product) continue;

        const price = product.discountPrice || product.price;
        subtotal += price * item.quantity;

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

    const deliveryFee = subtotal < 200 ? 15 : 0;
    const total = subtotal + fitFee + deliveryFee;

    const order = await OrderModel.create({
        userId,
        items: orderItems,
        shippingAddress: address,
        subtotal,
        fitAdjustmentFee: fitFee,
        deliveryFee,
        total,
        orderStatus: fitFee > 0 ? "fit_adjustment_in_progress" : "processing",
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });

    await CartModel.deleteOne({ userId });

    res.json({ success: true, order });
};

export const getOrderbyId = async (req, res) => {
    const orders = await OrderModel.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ orders });
};

