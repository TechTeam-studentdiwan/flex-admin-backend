
import ProductModel from "../Models/product.model.js";


export const getProducts = async (req, res) => {
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
        .limit(Number(limit));

    const total = await ProductModel.countDocuments(query);

    res.json({ products, total });
};

export const getProductbyId = async (req, res) => {
    const product = await ProductModel.findOne({ id: req.params.id });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
};

