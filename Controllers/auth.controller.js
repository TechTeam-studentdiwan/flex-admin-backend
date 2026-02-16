
import UserModel from "../Models/user.model.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'


const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user._id,
            email: user.email,
            isGuest: user.isGuest,
            isAdmin: user.isAdmin,
        },
        process.env.JWT_TOKEN,
        { expiresIn: "1d" }
    );
};

const sendTokenCookie = (res, user) => {
    const token = generateToken(user);

    res.cookie("userToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
    });

    return token;
};


export const registerUser = async (req, res) => {
    try {
        const { email, password, name, phone, isAdmin } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ success: false, message: "All fields required" });
        }

        const exists = await UserModel.findOne({ email });
        if (exists) {
            return res.status(400).json({ success: false, message: "Email already registered" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await UserModel.create({
            email,
            password: hashedPassword,
            name,
            phone,
            isAdmin,
            isGuest: false,
        });

        sendTokenCookie(res, user);
        const u = user.toObject();
        delete u.password;

        res.json({
            success: true,
            user: u,
            message: "Registration successful",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email & Password Required" });
    }
    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid email" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Incorrect password" });
        }

        sendTokenCookie(res, user);

        const u = user.toObject();
        delete u.password;

        res.json({
            success: true,
            user: u,
            message: "Login successful",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


export const guestUser = async (req, res) => {
    try {
        const user = await UserModel.create({
            isGuest: true,
            name: `Guest${Math.floor(Math.random() * 9000 + 1000)}`,
        });

        sendTokenCookie(res, user);

        res.json({
            success: true,
            user,
            message: "Guest session created",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};



