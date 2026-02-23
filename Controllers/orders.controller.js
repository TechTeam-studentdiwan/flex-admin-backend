
import CartModel from "../Models/cart.model.js";
import UserModel from "../Models/user.model.js";
import ProductModel from "../Models/product.model.js";
import OrderModel from "../Models/order.model.js";
import CouponModel from "../Models/coupon.model.js";

export const previewOrder = async (req, res) => {
    try {
        const { userId, shippingAddressId, couponCode } = req.body || {};
        const cart = await CartModel.findOne({ userId });
        if (!cart || !cart.items.length) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // const address = user.addresses.find(a => a._id.toString() === shippingAddressId);
        // if (!address) return res.json({ message: "Address not found" });

        let subtotal = 0;
        let fitFee = 0;

        for (const item of cart.items) {
            const product = await ProductModel.findById(item.productId);
            if (!product) continue;

            const price = product.discountPrice || product.price;
            const itemTotal = price * item.quantity;
            subtotal += itemTotal;

            if (item.fitAdjustment) {
                fitFee += (item.fitAdjustment.fee || 0) * item.quantity;
            }
        }

        // Delivery fee from admin or rule
        let deliveryFee = 0;
        const adminUser = await UserModel.findOne({ isAdmin: true });

        if (adminUser && typeof adminUser.deliveryfee === "number") {
            deliveryFee = adminUser.deliveryfee;
        } else {
            deliveryFee = subtotal < 200 ? 15 : 0;
        }

        // Coupon
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
                } else if (coupon.type === "freedelivery") {
                    discount = deliveryFee;
                }
            }
        }

        const total = subtotal - discount + fitFee + deliveryFee;

        return res.status(200).json({
            success: true,
            summary: {
                subtotal,
                discount,
                fitAdjustmentFee: fitFee,
                deliveryFee,
                total,
            },
        });
    } catch (err) {
        console.error("Preview order error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};


export const createOrder = async (req, res) => {
    try {
        const { userId, shippingAddressId, couponCode } = req.body || {};
        const cart = await CartModel.findOne({ userId })
        if (!cart || !cart.items.length) {
            return res.status(400).json({ message: "Cart is empty" });
        }
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const address = user.addresses.find(a => a._id.toString() === shippingAddressId);
        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }


        let subtotal = 0;
        let fitFee = 0;
        const orderItems = [];

        for (const item of cart.items) {
            const product = await ProductModel.findById(item.productId);
            if (!product) continue;

            const price = product.discountPrice || product.price;
            const itemTotal = price * item.quantity;
            subtotal += itemTotal;

            if (item.fitAdjustment) {
                fitFee += (item.fitAdjustment.fee || 0) * item.quantity;
            }
            orderItems.push({
                name: product.name,
                image: product.images?.[0] || "",
                size: item.size,
                quantity: item.quantity,
                price: price,
                discountPrice: product.discountPrice || 0,
                fitAdjustment: !!item.fitAdjustment,
                fitAdjustmentFee: item.fitAdjustment?.fee || 0,
            });
        }
        let deliveryFee = 0;

        const adminUser = await UserModel.findOne({ isAdmin: true });

        if (adminUser && typeof adminUser.deliveryfee === "number") {
            deliveryFee = adminUser.deliveryfee;
        } else {
            deliveryFee = subtotal < 200 ? 15 : 0;
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
                else if (coupon.type === "freedelivery") {
                    discount = deliveryFee;
                }
            }
        }

        const total = subtotal - discount + fitFee + deliveryFee;

        let extraDays = 5;
        const hasFitAdjustment = cart.items.some(item => item.fitAdjustment);
        if (hasFitAdjustment) extraDays += 3;

        const estimatedDelivery = new Date(Date.now() + extraDays * 24 * 60 * 60 * 1000);
          const tord = await OrderModel.countDocuments();
        const order = await OrderModel.create({
            userId,
            items: orderItems,
            shippingAddress: address,
            subtotal,
            discount,
            fitAdjustmentFee: fitFee,
            deliveryFee,
            total,
            orderNumber:tord+1,
            couponCode: couponCode || null,
            orderStatus: "pending",
            estimatedDelivery,
        });

        await CartModel.deleteOne({ userId });

        return res.status(200).json({
            success: true,
            order,
            summary: {
                subtotal,
                discount,
                fitAdjustmentFee: fitFee,
                deliveryFee,
                total,
            },
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};

export const updateOrderByAdmin = async (req, res) => {
    try {
        const { orderId } = req.params;
        const {
            orderStatus,
            paymentStatus,
            estimatedDelivery,
            trackingNumber,
        } = req.body || {};

        const updateData = {};

        if (orderStatus !== undefined) updateData.orderStatus = orderStatus;
        if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
        if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
        if (estimatedDelivery !== undefined)
            updateData.estimatedDelivery = new Date(estimatedDelivery);

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No fields provided to update",
            });
        }

        const order = await OrderModel.findByIdAndUpdate(
            orderId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Order updated successfully",
            order,
        });
    } catch (err) {
        console.error("Update order by admin error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


export const getOrdersbyuserId = async (req, res) => {

    try {
          const { userId } = req.params;

    // 1. Check if userId exists
    if (!userId) {
      return res.json({
        success: false,
        message: "userId is required",
      });
    }
        const orders = await OrderModel.find({ userId}).sort({ createdAt: -1 });
        res.status(200).json({ orders });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getOrderDetail = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await OrderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = "",
            orderStatus,
            paymentStatus,
            startDate,
            endDate,
            sortBy = "createdAt",
            sortOrder = "desc",
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        const filter = {};

        // 🔎 Search filter (orderNumber, shipping name, phone)
        if (search) {
            filter.$or = [
                { orderNumber: { $regex: search, $options: "i" } },
                { "shippingAddress.fullName": { $regex: search, $options: "i" } },
                { "shippingAddress.phone": { $regex: search, $options: "i" } },
                { couponCode: { $regex: search, $options: "i" } },
            ];
        }

        // 📦 Order status filter
        if (orderStatus) {
            filter.orderStatus = orderStatus;
        }

        // 💳 Payment status filter
        if (paymentStatus) {
            filter.paymentStatus = paymentStatus;
        }

        // 📅 Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }

        // 🔃 Sorting
        const sort = {
            [sortBy]: sortOrder === "asc" ? 1 : -1,
        };

        // 📊 Total count (for pagination UI)
        const totalOrders = await OrderModel.countDocuments(filter);

        // 📥 Fetch paginated orders
        const orders = await OrderModel.find(filter)
            .sort(sort)
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean();

        res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                total: totalOrders,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(totalOrders / limitNum),
            },
        });
    } catch (err) {
        console.error("Admin getAllOrders error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

