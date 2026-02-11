import CouponModel from "../Models/coupon.model.js";


export const getCoupons = async (req, res) => {
    const now = new Date();
    const coupons = await CouponModel.find({ isActive: true, validTo: { $gte: now } });
    res.json({ coupons });
};


export const validateCoupon = async (req, res) => {
    const { code, cartTotal, userId } = req.body;

    const coupon = await CouponModel.findOne({ code, isActive: true });
    if (!coupon) return res.status(404).json({ message: "Invalid coupon code" });

    const now = new Date();
    if (!(coupon.validFrom <= now && now <= coupon.validTo)) {
        return res.status(400).json({ message: "Coupon has expired" });
    }

    if (cartTotal < coupon.minCartValue) {
        return res.status(400).json({ message: `Minimum cart value is QAR ${coupon.minCartValue}` });
    }

    let discount = 0;
    if (coupon.type === "percentage") {
        discount = (cartTotal * coupon.value) / 100;
        if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else if (coupon.type === "flat") {
        discount = coupon.value;
    } else if (coupon.type === "freedelivery") {
        discount = 15;
    }

    res.json({
        valid: true,
        discount,
        message: `Coupon applied! You saved QAR ${discount.toFixed(2)}`,
    });
};


