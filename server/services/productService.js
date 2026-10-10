
const Product = require("../models/Product");

// Escape special characters so search input is treated as plain text.
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Get products with search, category, price, sorting, and pagination.
async function getProducts(query = {}) {
  const {
    q = "",
    category,
    minPrice,
    maxPrice,
    sort = "newest",
    page = 1,
    limit = 9,
  } = query;

  const filter = {};

  // Validate search input.
  if (typeof q !== "string") {
    throw new Error("Search query must be text");
  }

  // Validate minimum and maximum prices.
  const min =
    minPrice === undefined || minPrice === ""
      ? undefined
      : Number(minPrice);

  const max =
    maxPrice === undefined || maxPrice === ""
      ? undefined
      : Number(maxPrice);

  if (min !== undefined && (!Number.isFinite(min) || min < 0)) {
    throw new Error("minPrice must be a valid non-negative number");
  }

  if (max !== undefined && (!Number.isFinite(max) || max < 0)) {
    throw new Error("maxPrice must be a valid non-negative number");
  }

  if (min !== undefined && max !== undefined && min > max) {
    throw new Error("minPrice cannot be greater than maxPrice");
  }

  // Search product name, description, and category.
  if (q.trim()) {
    const searchPattern = escapeRegex(q.trim());

    filter.$or = [
      { name: { $regex: searchPattern, $options: "i" } },
      { description: { $regex: searchPattern, $options: "i" } },
      { category: { $regex: searchPattern, $options: "i" } },
    ];
  }

  // Validate category.
  if (category && category !== "All") {
    const allowedCategories = [
      "Electronics",
      "Fashion",
      "Home",
      "Accessories",
    ];

    if (!allowedCategories.includes(category)) {
      throw new Error("Invalid category");
    }

    filter.category = category;
  }

  // Apply price range.
  if (min !== undefined || max !== undefined) {
    filter.price = {};

    if (min !== undefined) filter.price.$gte = min;
    if (max !== undefined) filter.price.$lte = max;
  }

  // Supported sorting options.
  const sortOptions = {
    newest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    name_asc: { name: 1 },
  };

  // Validate and limit pagination values.
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10) || 9));

  // Fetch products and count matching results.
  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean(),

    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      total,
      page: pageNumber,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// Get all distinct categories.
async function getCategories() {
  return Product.distinct("category");
}

// Get one product by ID. Returns null if no matching product exists.
async function getProductById(id) {
  return Product.findById(id).lean();
}

module.exports = {
  getProducts,
  getCategories,
  getProductById,
};
