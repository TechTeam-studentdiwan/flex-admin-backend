
import UserModel from "../Models/user.model.js";
import bcrypt from 'bcrypt'

export const registerUser = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const exists = await UserModel.findOne({ email });
        if (exists) return res.status(400).json({ success: false, message: "Email already registered" });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await UserModel.create({ email, password: hashedPassword, name, isGuest: false });

        const u = user.toObject();
        delete u.password;

        res.json({ success: true, user: u, message: "Registration successful" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Incorrect password" });
        }

        const u = user.toObject();
        delete u.password;

        res.json({ success: true, user: u, message: "Login successful" });
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

        res.json({ success: true, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


