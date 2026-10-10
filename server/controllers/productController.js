const Product = require("../models/Product");

// Get products with search, filtering, sorting, and pagination
const getProducts = async (req, res) => {
  try {
    const {
      search = "",
      category = "",
      sort = "newest",
      page = "1",
      limit = "9",
      minPrice,
      maxPrice,
    } = req.query;

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 9));

    const filter = {};

    if (category && category !== "All") {
      filter.category = category;
    }

    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
        { category: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};

      if (minPrice !== undefined && Number.isFinite(Number(minPrice))) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice !== undefined && Number.isFinite(Number(maxPrice))) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      priceLow: { price: 1 },
      priceHigh: { price: -1 },
      name: { name: 1 },
    };

    const sortBy = sortOptions[sort] || sortOptions.newest;
    const skip = (currentPage - 1) * pageLimit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortBy)
        .skip(skip)
        .limit(pageLimit),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      products,
      pagination: {
        total,
        page: currentPage,
        limit: pageLimit,
        totalPages: Math.ceil(total / pageLimit),
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    return res.status(500).json({ message: "Unable to fetch products." });
  }
};

// Get all available categories
const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category");

    return res.status(200).json({
      categories: categories.sort((a, b) => a.localeCompare(b)),
    });
  } catch (error) {
    console.error("Get categories error:", error);
    return res.status(500).json({ message: "Unable to fetch categories." });
  }
};

// Get one product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    return res.status(200).json({ product });
  } catch (error) {
    console.error("Get product error:", error);
    return res.status(400).json({ message: "Invalid product ID." });
  }
};

module.exports = {
  getProducts,
  getCategories,
  getProductById,
};