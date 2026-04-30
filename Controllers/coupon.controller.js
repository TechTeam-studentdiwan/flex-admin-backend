import CouponModel from "../Models/coupon.model.js";
import OrderModel from "../Models/order.model.js";
import UserModel from "../Models/user.model.js";
import mongoose from "mongoose";

export const createCoupon = async (req, res) => {
    try {
        const data = req.body;

        if (!data.code || !data.type || data.value === undefined || !data.validFrom || !data.validTo) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const exists = await CouponModel.findOne({ code: data.code });
        if (exists) {
            return res.status(400).json({ message: "Coupon code already exists" });
        }

        const coupon = await CouponModel.create(data);

        return res.json({ success: true, coupon, message: "Coupon created" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};


export const updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const coupon = await CouponModel.findById(id);
        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }

        Object.assign(coupon, updates);
        await coupon.save();

        return res.json({ success: true, coupon, message: "Coupon updated" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};


export const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;

        const coupon = await CouponModel.findByIdAndDelete(id);
        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }

        return res.json({ success: true, message: "Coupon deleted" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getCoupons = async (req, res) => {
    try {
        const now = new Date();
        const { userId, cartTotal } = req.query;

        // Only public coupons (not assigned to a specific user)
        const query = { isActive: true, validTo: { $gte: now }, validFrom: { $lte: now }, assignedUserId: null };

        if (cartTotal !== undefined) {
            query.minCartValue = { $lte: parseFloat(cartTotal) };
        }

        let coupons = await CouponModel.find(query).sort({ createdAt: -1 });

        if (userId) {
            const userOrderCount = await OrderModel.countDocuments({ userId });

            const usageAgg = await OrderModel.aggregate([
                {
                    $match: {
                        userId: new mongoose.Types.ObjectId(userId),
                        couponCode: { $exists: true, $ne: null, $ne: "" },
                    },
                },
                { $group: { _id: "$couponCode", count: { $sum: 1 } } },
            ]);
            const usageMap = {};
            usageAgg.forEach((u) => { usageMap[u._id] = u.count; });

            coupons = coupons.filter((coupon) => {
                if (coupon.firstOrderOnly && userOrderCount > 0) return false;
                const used = usageMap[coupon.code] || 0;
                if (used >= coupon.useLimitperUser) return false;
                return true;
            });
        }

        res.json({ coupons });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};


export const validateCoupon = async (req, res) => {
    try {
        const { code, cartTotal, userId } = req.body;

        const coupon = await CouponModel.findOne({ code, isActive: true });
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Invalid coupon code" });
        }

        // If this voucher is assigned to a specific user, enforce it
        if (coupon.assignedUserId && coupon.assignedUserId.toString() !== userId?.toString()) {
            return res.status(403).json({ success: false, message: "This voucher is not assigned to your account" });
        }

        const now = new Date();

        if (!(coupon.validFrom <= now && now <= coupon.validTo)) {
            return res.json({ success: false, message: "Coupon has expired" });
        }

        if (cartTotal < coupon.minCartValue) {
            return res.json({
                success: false,
                message: `Minimum cart value is QAR ${coupon.minCartValue}`,
            });
        }

        const usedCount = await OrderModel.countDocuments({
            userId,
            couponCode: code,
            // orderStatus: { $ne: "cancelled" }
        });

        if (usedCount >= coupon.useLimitperUser) {
            return res.json({
                success: false,
                message: `You have already used this coupon ${usedCount} time(s). Usage limit reached.`,
            });
        }

        let discount = 0;

        if (coupon.type === "percentage") {
            discount = (cartTotal * coupon.value) / 100;
            if (coupon.maxDiscount) {
                discount = Math.min(discount, coupon.maxDiscount);
            }
        } else if (coupon.type === "flat") {
            discount = coupon.value;
        } else if (coupon.type === "freedelivery") {
            discount = 15;
        }

        return res.json({
            success: true,
            valid: true,
            discount,
            remainingUses: coupon.useLimitperUser - usedCount,
            message: `Coupon applied! You saved QAR ${discount.toFixed(2)}`,
        });
    } catch (err) {
        console.error("Validate coupon error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get all personal vouchers assigned to a user
export const getMyVouchers = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ message: "userId required" });

        const now = new Date();
        const vouchers = await CouponModel.find({ assignedUserId: userId }).sort({ createdAt: -1 });

        const usageAgg = await OrderModel.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    couponCode: { $exists: true, $ne: null, $ne: "" },
                },
            },
            { $group: { _id: "$couponCode", count: { $sum: 1 } } },
        ]);
        const usageMap = {};
        usageAgg.forEach((u) => { usageMap[u._id] = u.count; });

        const enriched = vouchers.map((v) => {
            const used = usageMap[v.code] || 0;
            const isExpired = v.validTo < now || !v.isActive;
            const isUsed = used >= v.useLimitperUser;
            return {
                ...v.toObject(),
                used,
                isExpired,
                isUsed,
                canUse: !isExpired && !isUsed,
            };
        });

        res.json({ success: true, vouchers: enriched });
    } catch (err) {
        console.error("getMyVouchers error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Admin: assign a personal voucher to a specific user
export const assignVoucher = async (req, res) => {
    try {
        const { userId, code, type, value, validFrom, validTo, description, maxDiscount, minCartValue } = req.body;

        if (!userId || !code || !type || value === undefined || !validFrom || !validTo) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const exists = await CouponModel.findOne({ code });
        if (exists) return res.status(400).json({ message: "Coupon code already exists" });

        const voucher = await CouponModel.create({
            code: code.toUpperCase(),
            type,
            value: Number(value),
            validFrom: new Date(validFrom),
            validTo: new Date(validTo),
            description,
            maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
            minCartValue: minCartValue ? Number(minCartValue) : 0,
            usageLimit: 1,
            useLimitperUser: 1,
            isActive: true,
            assignedUserId: userId,
        });

        res.json({ success: true, voucher, message: `Voucher assigned to ${user.name || user.email}` });
    } catch (err) {
        console.error("assignVoucher error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

