import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./Config/connection.config.js";

import cartRouter from "./Routes/cart.routes.js";
import authRouter from "./Routes/auth.routes.js";
import couponRouter from "./Routes/coupon.routes.js";
import orderRouter from "./Routes/order.routes.js";
import productRouter from "./Routes/product.routes.js";
import userRouter from "./Routes/user.routes.js";
import wishlistRouter from "./Routes/wishlist.routes.js";


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


app.use("/auth", authRouter);
app.use("/cart", cartRouter);
app.use("/coupons", couponRouter);
app.use("/orders", orderRouter);
app.use("/products", productRouter);
app.use("/user", userRouter); 
app.use("/wishlist", wishlistRouter);


const PORT = process.env.PORT || 8000;
app.listen(PORT, async () => {
    try {
        await connectDB;
        console.log(
            `App listening successfully on port : ${PORT} => http://localhost:${PORT}`
        );
    } catch (error) {
        console.error(error);
    }
});
