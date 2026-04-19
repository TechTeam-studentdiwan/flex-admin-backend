
import CartModel from "../Models/cart.model.js";
import UserModel from "../Models/user.model.js";
import ProductModel from "../Models/product.model.js";
import OrderModel from "../Models/order.model.js";
import CouponModel from "../Models/coupon.model.js";
import AreaModel from "../Models/area.model.js";
import axios from 'axios'

async function resolveDeliveryFee(address) {
    if (address?.areaId) {
        const area = await AreaModel.findById(address.areaId);
        if (area) return area.deliveryFee;
    }
    const adminUser = await UserModel.findOne({ isAdmin: true });
    if (adminUser && typeof adminUser.deliveryfee === "number") {
        return adminUser.deliveryfee;
    }
    return 0;
}
function calculateEstimatedDelivery(cartItems) {
    let extraDays = cartItems?.estimatedDeliveryDays || 3;
    const hasFitAdjustment = cartItems.some(i => i.fitAdjustment);
    if (hasFitAdjustment) extraDays += 3;

    return new Date(Date.now() + extraDays * 24 * 60 * 60 * 1000);
}


export const previewOrder = async (req, res) => {
    try {
        const { userId, couponCode, shippingAddressId } = req.body || {};
        const cart = await CartModel.findOne({ userId });
        if (!cart || !cart.items.length) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        let subtotal = 0;
        let fitFee = 0;
        let payNowSubtotal = 0;
        let codSubtotal = 0;

        for (const item of cart.items) {
            const product = await ProductModel.findById(item.productId);
            if (!product) continue;

            const price = product.discountPrice || product.price;
            const itemTotal = price * item.quantity;
            subtotal += itemTotal;

            if (item.fitAdjustment) {
                fitFee += (item.fitAdjustment.fee || 0) * item.quantity;
            }

            if (item.paymentType === "online") {
                payNowSubtotal += itemTotal;
            } else {
                codSubtotal += itemTotal;
            }
        }

        const hasOnline = payNowSubtotal > 0;
        const hasCod = codSubtotal > 0;

        // Delivery fee — area-based or global fallback
        let address = null;
        if (shippingAddressId) {
            const user = await UserModel.findById(userId);
            address = user?.addresses.find(a => a._id.toString() === shippingAddressId);
        }
        const deliveryFee = await resolveDeliveryFee(address);

        // Coupon
        let discount = 0;
        if (couponCode) {
            const now = new Date();
            const coupon = await CouponModel.findOne({ code: couponCode, isActive: true });

            if (coupon && coupon.validFrom <= now && now <= coupon.validTo) {
                if (coupon.type === "percentage") {
                    discount = (subtotal * coupon.value) / 100;
                    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
                } else if (coupon.type === "flat") {
                    discount = coupon.value;
                } else if (coupon.type === "freedelivery") {
                    discount = deliveryFee;
                }
            }
        }

        const grandTotal = subtotal - discount + fitFee + deliveryFee;

        let payNowAmount = 0;
        let codAmount = 0;

        if (hasCod && !hasOnline) {
            // ✅ All COD
            codAmount = Math.max(0, codSubtotal - discount) + fitFee + deliveryFee;
            payNowAmount = 0;
        }
        else if (hasOnline && !hasCod) {
            // ✅ All Online
            payNowAmount = Math.max(0, payNowSubtotal - discount) + fitFee + deliveryFee;
            codAmount = 0;
        }
        else {
            // ✅ Mixed: keep charges on ONLINE
            payNowAmount = Math.max(0, payNowSubtotal - discount) + fitFee + deliveryFee;
            codAmount = codSubtotal;
        }


        const estimatedDeliveryDate = calculateEstimatedDelivery(cart.items);

        return res.status(200).json({
            success: true,
            summary: {
                subtotal,
                discount,
                fitAdjustmentFee: fitFee,
                deliveryFee,
                payNowAmount,
                codAmount,
                grandTotal,
                estimatedDeliveryDate,
            },
        });
    } catch (err) {
        console.error("Preview order error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};



export const paymentVerify = async (req, res) => {
  try {
    const { chargeId, orderId } = req.body;

    if (!chargeId || !orderId) {
      return res.status(400).json({
        success: false,
        message: "chargeId and orderId are required",
      });
    }

    // Tap secret key
    const TAP_SECRET_KEY = process.env.TAP_SECRET_KEY;

    // 1️⃣ Retrieve charge from Tap
    const tapResponse = await axios.get(
      `https://api.tap.company/v2/charges/${chargeId}`,
      {
        headers: {
          Authorization: `Bearer ${TAP_SECRET_KEY}`,
        },
      }
    );

    const chargeData = tapResponse.data;

    console.log("Tap Charge Response:", chargeData);

    // 2️⃣ Check payment status
    if (chargeData.status !== "CAPTURED") {
      return res.status(400).json({
        success: false,
        message: "Payment not captured",
        status: chargeData.status,
      });
    }

    // 3️⃣ Update order
    const order = await OrderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.paymentStatus = "paid";
    order.paymentReferenceId = chargeId;
    order.orderStatus = "confirmed";

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order,
    });
  } catch (error) {
    console.error("Payment verification error:", error.response?.data || error);

    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};


export const createOrder = async (req, res) => {
    try {
        const { userId, shippingAddressId, couponCode } = req.body || {};

        const cart = await CartModel.findOne({ userId });
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
        let payNowSubtotal = 0;
        let codSubtotal = 0;

        const orderItems = [];
        let paymentType = "cash on delivery";
        for (const item of cart.items) {
            const product = await ProductModel.findById(item.productId);
            if (!product) continue;
            if(!product.codAvailable){
               paymentType = "online";
            }

            const price = product.discountPrice || product.price;
            const itemTotal = price * item.quantity;

            subtotal += itemTotal;

            if (item.fitAdjustment) {
                fitFee += (item.fitAdjustment.fee || 0) * item.quantity;
            }

            // snapshot item into order
            orderItems.push({
                name: product.name,
                image: product.images?.[0] || "",
                size: item.size,
                quantity: item.quantity,
                price: price,
                discountPrice: product.discountPrice || 0,
                fitAdjustment: item.fitAdjustment || null,
                fitAdjustmentFee: item.fitAdjustment?.fee || 0,
            });
        }
        // Delivery fee — area-based or global fallback
        const deliveryFee = await resolveDeliveryFee(address);

        // Coupon
        let discount = 0;
        if (couponCode) {
            const now = new Date();
            const coupon = await CouponModel.findOne({ code: couponCode, isActive: true });

            if (coupon && coupon.validFrom <= now && now <= coupon.validTo) {
                if (coupon.type === "percentage") {
                    discount = (subtotal * coupon.value) / 100;
                    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
                } else if (coupon.type === "flat") {
                    discount = coupon.value;
                } else if (coupon.type === "freedelivery") {
                    discount = deliveryFee;
                }
            }
        }

        const grandTotal = subtotal - discount + fitFee + deliveryFee;


        const estimatedDelivery = calculateEstimatedDelivery(cart.items);

        const tord = await OrderModel.countDocuments();

        const order = await OrderModel.create({
            userId,
            items: orderItems,
            shippingAddress: address,
            subtotal,
            discount,
            fitAdjustmentFee: fitFee,
            deliveryFee,
            total: grandTotal,
            orderNumber: 1000 + tord + 1,
            couponCode: couponCode || null,
            orderStatus:paymentType== "online"? "pending":"processing",
            estimatedDelivery,
            paymentType
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
                grandTotal,
                estimatedDeliveryDate: estimatedDelivery,
            },
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};



export const previewBuyNow = async (req, res) => {
    try {
        const { userId, productId, size, quantity = 1, paymentType = "online", fitAdjustment, shippingAddressId, couponCode } = req.body || {};

        const product = await ProductModel.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });

        const price = product.discountPrice || product.price;
        const subtotal = price * quantity;
        const fitFee = fitAdjustment?.fee ? fitAdjustment.fee * quantity : 0;

        let address = null;
        if (shippingAddressId) {
            const user = await UserModel.findById(userId);
            address = user?.addresses.find(a => a._id.toString() === shippingAddressId);
        }
        const deliveryFee = await resolveDeliveryFee(address);

        let discount = 0;
        if (couponCode) {
            const now = new Date();
            const coupon = await CouponModel.findOne({ code: couponCode, isActive: true });
            if (coupon && coupon.validFrom <= now && now <= coupon.validTo) {
                if (coupon.type === "percentage") {
                    discount = (subtotal * coupon.value) / 100;
                    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
                } else if (coupon.type === "flat") {
                    discount = coupon.value;
                } else if (coupon.type === "freedelivery") {
                    discount = deliveryFee;
                }
            }
        }

        const grandTotal = subtotal - discount + fitFee + deliveryFee;
        const hasFitAdjustment = !!fitAdjustment;
        let extraDays = product.estimatedDeliveryDays || 3;
        if (hasFitAdjustment) extraDays += 3;
        const estimatedDeliveryDate = new Date(Date.now() + extraDays * 24 * 60 * 60 * 1000);

        const isCod = paymentType === "cod";
        return res.status(200).json({
            success: true,
            summary: {
                subtotal,
                discount,
                fitAdjustmentFee: fitFee,
                deliveryFee,
                payNowAmount: isCod ? 0 : grandTotal,
                codAmount: isCod ? grandTotal : 0,
                grandTotal,
                estimatedDeliveryDate,
            },
        });
    } catch (err) {
        console.error("previewBuyNow error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

export const buyNowOrder = async (req, res) => {
    try {
        const { userId, productId, size, quantity = 1, paymentType = "online", fitAdjustment, shippingAddressId, couponCode } = req.body || {};

        const product = await ProductModel.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });

        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const address = user.addresses.find(a => a._id.toString() === shippingAddressId);
        if (!address) return res.status(404).json({ message: "Address not found" });

        const price = product.discountPrice || product.price;
        const subtotal = price * quantity;
        const fitFee = fitAdjustment?.fee ? fitAdjustment.fee * quantity : 0;
        const deliveryFee = await resolveDeliveryFee(address);

        let discount = 0;
        if (couponCode) {
            const now = new Date();
            const coupon = await CouponModel.findOne({ code: couponCode, isActive: true });
            if (coupon && coupon.validFrom <= now && now <= coupon.validTo) {
                if (coupon.type === "percentage") {
                    discount = (subtotal * coupon.value) / 100;
                    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
                } else if (coupon.type === "flat") {
                    discount = coupon.value;
                } else if (coupon.type === "freedelivery") {
                    discount = deliveryFee;
                }
            }
        }

        const grandTotal = subtotal - discount + fitFee + deliveryFee;

        let extraDays = product.estimatedDeliveryDays || 3;
        if (fitAdjustment) extraDays += 3;
        const estimatedDelivery = new Date(Date.now() + extraDays * 24 * 60 * 60 * 1000);

        const finalPaymentType = paymentType === "cod" && product.codAvailable ? "cash on delivery" : "online";

        const orderItem = {
            name: product.name,
            image: product.images?.[0] || "",
            size,
            quantity,
            price,
            discountPrice: product.discountPrice || 0,
            fitAdjustment: fitAdjustment || null,
            fitAdjustmentFee: fitAdjustment?.fee || 0,
        };

        const tord = await OrderModel.countDocuments();
        const order = await OrderModel.create({
            userId,
            items: [orderItem],
            shippingAddress: address,
            subtotal,
            discount,
            fitAdjustmentFee: fitFee,
            deliveryFee,
            total: grandTotal,
            orderNumber: 1000 + tord + 1,
            couponCode: couponCode || null,
            orderStatus: finalPaymentType === "online" ? "pending" : "processing",
            estimatedDelivery,
            paymentType: finalPaymentType,
        });

        return res.status(200).json({
            success: true,
            order,
            summary: {
                subtotal,
                discount,
                fitAdjustmentFee: fitFee,
                deliveryFee,
                grandTotal,
                estimatedDeliveryDate: estimatedDelivery,
            },
        });
    } catch (err) {
        console.error("buyNowOrder error:", err);
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

export const createPaymentURL = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await OrderModel.findById(orderId);
    const user = await UserModel.findById(order.userId)
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Return the transaction URL to the frontend
    res.status(200).json({
      url: response.data.transaction.url,
      chargeId: response.data.id
    });

  } catch (error) {
    console.error('Tap Payment Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Internal Server Error' });
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
        const orders = await OrderModel.find({ userId }).sort({ createdAt: -1 });
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

