
import ProductModel from "../Models/product.model.js";

export const addProduct = async (req, res) => {
    try {
        const data = req.body || {};
        if (!data.name || data.price === undefined || !data.category) {
            return res.status(400).json({ message: "Name, price and category are required" });
        }

        const product = await ProductModel.create(data);

        return res.json({ success: true, product, message: "Product added" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const product = await ProductModel.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        Object.assign(product, updates);
        await product.save();

        return res.json({ success: true, product, message: "Product updated" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};


export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await ProductModel.findByIdAndDelete(id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        return res.json({ success: true, message: "Product deleted" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getProducts = async (req, res) => {

    try {
        const { category, search, minPrice, maxPrice, sort = "popular", limit = 20, skip = 0 } = req.query;

        let query = { isActive: true };

        if (category) query.category = category;

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        if (minPrice || maxPrice) {
            query.$or = [
                { discountPrice: { $gte: Number(minPrice || 0), $lte: Number(maxPrice || 999999) } },
                { discountPrice: null, price: { $gte: Number(minPrice || 0), $lte: Number(maxPrice || 999999) } },
            ];
        }

        const sortMap = {
            popular: { createdAt: -1 },
            new: { createdAt: -1 },
            price_low: { price: 1 },
            price_high: { price: -1 },
        };

        const products = await ProductModel.find(query)
            .sort(sortMap[sort] || { createdAt: -1 })
            .skip(Number(skip))
            .limit(Number(limit))
            .populate("category");

        const total = await ProductModel.countDocuments(query);

        res.status(200).json({ success: true, products, total });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getProductbyId = async (req, res) => {
    const product = await ProductModel.findOne({ id: req.params.id }).populate("category")
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, product });
};

