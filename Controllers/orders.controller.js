
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



export const createCharge = async (req, res) => {
  try {
    const { tokenId, orderId, amount, currency, customer } = req.body;

    if (!tokenId || !orderId || !amount) {
      return res.status(400).json({ success: false, message: 'tokenId, orderId and amount are required' });
    }

    const amountValue = parseFloat(parseFloat(amount).toFixed(2));
    if (!amountValue || amountValue <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const TAP_SECRET_KEY = process.env.TAP_SECRET_KEY;
    const shortRef = orderId.slice(-12);

    const resolvedCurrency = currency || 'QAR';
    const chargePayload = {
      amount: amountValue,
      currency: resolvedCurrency,
      threeDSecure: true,
      save_card: false,
      description: `Order ${shortRef}`,
      order: {
        id: '',
        amount: amountValue,
        currency: resolvedCurrency,
        description: `Order ${shortRef}`,
      },
      reference: { transaction: `txn_${shortRef}`, order: shortRef },
      receipt: { email: false, sms: false },
      customer: {
        first_name: customer?.firstName || 'Customer',
        last_name: customer?.lastName || 'User',
        email: customer?.email || 'customer@example.com',
        phone: {
          country_code: customer?.countryCode || '974',
          number: (customer?.phone || '').replace(/\D/g, ''),
        },
      },
      source: { id: tokenId },
      redirect: { url: `${process.env.BACKEND_URL || 'https://backend.sahibawears.com'}/orders/tap/callback` },
    };

    console.log('TAP charge payload:', JSON.stringify(chargePayload, null, 2));

    const tapResponse = await axios.post(
      'https://api.tap.company/v2/charges/',
      chargePayload,
      {
        headers: {
          Authorization: `Bearer ${TAP_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const charge = tapResponse.data;

    return res.status(200).json({
      success: true,
      chargeId: charge.id,
      status: charge.status,
      redirectUrl: charge.transaction?.url || null,
    });
  } catch (error) {
    console.error('Create charge error:', error.response?.data || error);
    const msg = error.response?.data?.errors?.[0]?.description || 'Charge creation failed';
    return res.status(500).json({ success: false, message: msg });
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

    // Clear the cart now that payment is confirmed
    await CartModel.deleteOne({ userId: order.userId });

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
        const fetchedProducts = [];
        let paymentType = "cash on delivery";
        for (const item of cart.items) {
            const product = await ProductModel.findById(item.productId);
            if (!product) continue;
            if (!product.codAvailable) {
               paymentType = "online";
            }

            fetchedProducts.push({ item, product });

            const price = product.discountPrice || product.price;
            const itemTotal = price * item.quantity;

            subtotal += itemTotal;

            if (item.fitAdjustment) {
                fitFee += (item.fitAdjustment.fee || 0) * item.quantity;
            }

            // snapshot item into order
            orderItems.push({
                productId: product._id,
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

        // Decrement stock using already-fetched products
        for (const { item, product } of fetchedProducts) {
            const hasSizeStock = product.sizeStock && product.sizeStock.has(item.size);
            if (hasSizeStock) {
                const cur = product.sizeStock.get(item.size) || 0;
                product.sizeStock.set(item.size, Math.max(0, cur - item.quantity));
                product.markModified("sizeStock");
            }
            product.stock = Math.max(0, (product.stock || 0) - item.quantity);
            await product.save();
        }

        // For COD orders the cart clears immediately.
        // For online-payment orders the cart is cleared only after payment is verified,
        // so a failed/cancelled payment does not empty the cart.
        if (paymentType === "cash on delivery") {
            await CartModel.deleteOne({ userId });
        }

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

        // Stock validation
        const hasSizeStock = product.sizeStock && product.sizeStock.has(size);
        const availableStock = hasSizeStock
            ? (product.sizeStock.get(size) ?? 0)
            : (product.stock ?? 0);
        if (quantity > availableStock) {
            return res.status(400).json({
                success: false,
                message: availableStock > 0
                    ? `Only ${availableStock} unit${availableStock !== 1 ? "s" : ""} left for size ${size}`
                    : `Size ${size} is out of stock`,
                availableStock,
            });
        }

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
            productId: product._id,
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

        // Decrement stock
        if (hasSizeStock) {
            const cur = product.sizeStock.get(size) || 0;
            product.sizeStock.set(size, Math.max(0, cur - quantity));
            product.markModified("sizeStock");
        }
        product.stock = Math.max(0, (product.stock || 0) - quantity);
        await product.save();

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

        const existingOrder = await OrderModel.findById(orderId);
        if (!existingOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Restore stock when cancelling a non-cancelled order
        if (orderStatus === "cancelled" && existingOrder.orderStatus !== "cancelled") {
            for (const item of existingOrder.items) {
                if (!item.productId) continue;
                const product = await ProductModel.findById(item.productId);
                if (!product) continue;
                const hasSizeStock = product.sizeStock && product.sizeStock.has(item.size);
                if (hasSizeStock) {
                    const cur = product.sizeStock.get(item.size) || 0;
                    product.sizeStock.set(item.size, cur + item.quantity);
                    product.markModified("sizeStock");
                }
                product.stock = (product.stock || 0) + item.quantity;
                await product.save();
            }
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

export const publicTrackOrder = async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const order = await OrderModel.findOne({ orderNumber }).lean();
        if (!order) {
            return res.status(404).send(`<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Order Not Found</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb}.box{text-align:center;padding:32px}h1{color:#471755}p{color:#666}</style></head><body><div class="box"><h1>Order Not Found</h1><p>No order found with number <b>#${orderNumber}</b>.</p></div></body></html>`);
        }

        const addr = order.shippingAddress || {};
        const addressParts = [
            addr.addressType === "villa" ? `Villa ${addr.villaNo}` : `Building ${addr.buildingNo}, Floor ${addr.floorNo}, Room ${addr.roomNo}`,
            `Street ${addr.streetNo}`,
            `Zone ${addr.zoneNo}`,
            addr.city,
            addr.country,
        ].filter(Boolean);

        const statusColors = {
            pending: "#F59E0B",
            confirmed: "#10B981",
            processing: "#3B82F6",
            fit_adjustment_in_progress: "#8B5CF6",
            shipped: "#0EA5E9",
            delivered: "#059669",
            cancelled: "#EF4444",
        };
        const statusColor = statusColors[order.orderStatus] || "#6B7280";

        const statusLabel = (order.orderStatus || "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

        const itemsHTML = (order.items || []).map(item => `
            <tr>
                <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;">
                    <div style="font-weight:600;color:#111;">${item.name}</div>
                    <div style="font-size:12px;color:#6b7280;margin-top:2px;">Size: ${item.size} &nbsp;|&nbsp; Qty: ${item.quantity}</div>
                    ${item.fitAdjustment ? `<div style="font-size:11px;color:#8b5cf6;margin-top:3px;">✂ Includes Fit Adjustment</div>` : ""}
                </td>
                <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:600;color:#471755;">
                    QAR ${(item.discountPrice || item.price).toFixed(2)}
                </td>
            </tr>`).join("");

        const estimatedStr = order.estimatedDelivery
            ? new Date(order.estimatedDelivery).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
            : "—";

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Order #${order.orderNumber} — Sahiba Wears</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f3f4f6;color:#111;padding:16px}
    .card{background:#fff;border-radius:16px;max-width:520px;margin:0 auto;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)}
    .header{background:linear-gradient(135deg,#471755,#7c3aed);padding:28px 24px;color:#fff;text-align:center}
    .store-name{font-size:24px;font-weight:800;letter-spacing:.5px}
    .store-tag{font-size:12px;opacity:.75;margin-top:4px}
    .order-num{font-size:32px;font-weight:800;margin-top:12px;letter-spacing:1px}
    .status-badge{display:inline-block;padding:6px 18px;border-radius:20px;font-weight:700;font-size:14px;margin-top:12px}
    .section{padding:20px 24px;border-bottom:1px solid #f3f4f6}
    .section:last-child{border-bottom:none}
    .section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#9ca3af;margin-bottom:12px}
    .info-row{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;font-size:14px}
    .info-label{color:#6b7280}
    .info-val{font-weight:600;color:#111;text-align:right;max-width:60%}
    table{width:100%;border-collapse:collapse}
    .summary-row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px;color:#555}
    .total-row{display:flex;justify-content:space-between;padding:10px 0 0;font-size:16px;font-weight:800;color:#471755;border-top:2px solid #e5e7eb;margin-top:6px}
    .estimate-box{background:#f0fdf4;border-radius:10px;padding:12px 16px;display:flex;align-items:center;gap:10px;margin-top:4px}
    .estimate-box span{font-size:14px;color:#166534;font-weight:600}
    .footer{text-align:center;padding:20px 24px;font-size:12px;color:#9ca3af}
    @media(max-width:480px){.order-num{font-size:24px}}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="store-name">Sahiba Wears</div>
      <div class="store-tag">Ethnic &amp; Traditional Wear — Doha, Qatar</div>
      <div class="order-num">#${order.orderNumber}</div>
      <div class="status-badge" style="background:${statusColor}22;color:${statusColor};border:1.5px solid ${statusColor}44">
        ${statusLabel}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Delivery Address</div>
      <div style="font-size:15px;font-weight:700;color:#111;margin-bottom:4px">${addr.fullName}</div>
      <div style="font-size:14px;color:#555;line-height:1.6">${addressParts.join(", ")}</div>
      <div style="font-size:14px;color:#555;margin-top:4px">📞 ${addr.phone}</div>
    </div>

    <div class="section">
      <div class="section-title">Order Items</div>
      <table>${itemsHTML}</table>
    </div>

    <div class="section">
      <div class="section-title">Payment Summary</div>
      <div class="summary-row"><span>Subtotal</span><span>QAR ${order.subtotal.toFixed(2)}</span></div>
      ${order.discount > 0 ? `<div class="summary-row"><span>Discount${order.couponCode ? ` (${order.couponCode})` : ""}</span><span style="color:#10b981">−QAR ${order.discount.toFixed(2)}</span></div>` : ""}
      ${order.fitAdjustmentFee > 0 ? `<div class="summary-row"><span>Fit Adjustment</span><span>QAR ${order.fitAdjustmentFee.toFixed(2)}</span></div>` : ""}
      <div class="summary-row"><span>Delivery</span><span>${order.deliveryFee === 0 ? "FREE" : `QAR ${order.deliveryFee.toFixed(2)}`}</span></div>
      <div class="total-row"><span>Total</span><span>QAR ${order.total.toFixed(2)}</span></div>
    </div>

    <div class="section">
      <div class="section-title">Delivery Info</div>
      <div class="info-row"><span class="info-label">Payment</span><span class="info-val">${(order.paymentType || "").replace(/\b\w/g, c => c.toUpperCase())}</span></div>
      <div class="info-row"><span class="info-label">Payment Status</span><span class="info-val">${(order.paymentStatus || "").toUpperCase()}</span></div>
      ${order.trackingNumber ? `<div class="info-row"><span class="info-label">Tracking #</span><span class="info-val">${order.trackingNumber}</span></div>` : ""}
      <div class="estimate-box">
        <span>🚚 Estimated Delivery: ${estimatedStr}</span>
      </div>
    </div>

    <div class="footer">
      Placed on ${new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}<br/>
      Thank you for shopping with Sahiba Wears ✨
    </div>
  </div>
</body>
</html>`;

        res.setHeader("Content-Type", "text/html");
        res.send(html);
    } catch (err) {
        console.error("publicTrackOrder error:", err);
        res.status(500).send("Server error");
    }
};

