import jwt from "jsonwebtoken";
import UserModel from "../Models/user.model.js";

export const authentication = async (req, res, next) => {
    try {
        let token = null;

        // 1. From custom header: userToken
        if (req.headers.usertoken) {
            token = req.headers.usertoken;
        }

        // 2. Or from standard header: Authorization: Bearer <token>
        if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        // 3. Or (if you kept cookies) from cookie
        if (!token && req.cookies?.userToken) {
            token = req.cookies.userToken;
        }

        if (!token) {
            return res.status(401).json({ success: false, message: "Not authorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_TOKEN);

        const user = await UserModel.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }

        req.user = user;

       next();
    } catch (err) {
        console.error(err);
        return res.status(401).json({ success: false, message: "Not authorized, invalid token" });
    }
};
