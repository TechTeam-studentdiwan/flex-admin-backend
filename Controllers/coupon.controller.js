import CouponModel from "../Models/coupon.model.js";
import OrderModel from "../Models/order.model.js";

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
        const coupons = await CouponModel.find({ isActive: true, validTo: { $gte: now } });
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



