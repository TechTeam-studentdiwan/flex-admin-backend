
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
        const {
            category,
            search,
            minPrice,
            maxPrice,
            occasion,
            fabric,
            fitAdjustmentEnabled,
            codAvailable,
            sort = "popular",
            limit = 20,
            skip = 0
        } = req.query;

        let query = { isActive: true };

        // 1. Category Filter
        if (category) query.category = category;

        // 2. Search Filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        // 3. Occasion & Fabric Filters
        if (occasion) query.occasion = occasion;
        if (fabric) query.fabric = fabric;

        if (codAvailable) query.codAvailable = codAvailable;
        // 4. Fit Adjustment Filter
        if (fitAdjustmentEnabled === 'true' || fitAdjustmentEnabled === true) {
            query.fitAdjustmentEnabled = true;
        }

        // 5. Price Range Filter
        if (minPrice || maxPrice) {
            const min = Number(minPrice || 0);
            const max = Number(maxPrice || 999999);

            // This checks both discountPrice (if it exists) OR standard price
            query.$and = [
                {
                    $or: [
                        { discountPrice: { $exists: true, $ne: null } },
                        { price: { $exists: true } }
                    ]
                },
                {
                    $or: [
                        { discountPrice: { $gte: min, $lte: max } },
                        { $and: [{ discountPrice: null }, { price: { $gte: min, $lte: max } }] }
                    ]
                }
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
    const product = await ProductModel.findOne({ _id: req.params.id }).populate("category")
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, product });
};

