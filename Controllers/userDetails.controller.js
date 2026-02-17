import UserModel from "../Models/user.model.js";
import bcrypt from 'bcrypt'
import ProductModel from "../Models/product.model.js";
import OrderModel from "../Models/order.model.js";
import CouponModel from "../Models/coupon.model.js";

export const updateUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, email, phone, deliveryfee, password } = req.body || {};

        const updateData = {};

        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;

        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            updateData.password = hashedPassword;
        }

        // 🚚 Only admin can update delivery fee
        if (deliveryfee !== undefined) {
            if (!user.isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: "Only admin can update delivery fee",
                });
            }
            updateData.deliveryfee = deliveryfee;
        }

        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-password");

        return res.json({
            success: true,
            message: "User profile updated successfully",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Update user profile error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while updating profile",
        });
    }
};


export const getAllUsersByAdmin = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = "",
            isAdmin,
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        const filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
            ];
        }

        if (isAdmin !== undefined) {
            filter.isAdmin = isAdmin === "true";
        }

        const totalUsers = await UserModel.countDocuments(filter);

        const users = await UserModel.find(filter)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean();

        return res.status(200).json({
            success: true,
            data: users,
            pagination: {
                total: totalUsers,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(totalUsers / limitNum),
            },
        });
    } catch (error) {
        console.error("Admin getAllUsers error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching users",
        });
    }
};



export const getAdminDashboardOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      totalProducts,
      activeCoupons,
      totalOrders,
      pendingOrders,
      revenueAgg,
      recentOrders,
    ] = await Promise.all([
      // 1) Non-admin users count
      UserModel.countDocuments({ isAdmin: false }),

      // 2) Total products
      ProductModel.countDocuments({}),

      // 3) Active coupons
      CouponModel.countDocuments({ isActive: true }),

      // 4) Total orders
      OrderModel.countDocuments({}),

      // 5) Pending orders
      OrderModel.countDocuments({ orderStatus: "pending" }),

      // 6) Total revenue (only paid, exclude failed/refunded)
      OrderModel.aggregate([
        { $match: { paymentStatus: "paid" } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$total" },
          },
        },
      ]),

      // 7) Recent 5 orders
      OrderModel.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select(
          "orderNumber userId total paymentStatus orderStatus createdAt shippingAddress.fullName shippingAddress.phone"
        )
        .lean(),
    ]);

    const totalRevenue = revenueAgg.length ? revenueAgg[0].totalRevenue : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        activeCoupons,
        totalOrders,
        pendingOrders,
        totalRevenue,
        recentOrders,
      },
    });
  } catch (err) {
    console.error("Admin dashboard overview error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while loading dashboard",
    });
  }
};

