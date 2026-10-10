const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");

const createOrder = async (req, res) => {
  try {
    const {
      customer,
      items,
      paymentMethod = "Cash on Delivery",
    } = req.body;

    // Validate required customer details
    const requiredFields = [
      "name",
      "phone",
      "address",
      "city",
      "state",
      "postalCode",
    ];

    if (
      !customer ||
      requiredFields.some(
        (field) =>
          typeof customer[field] !== "string" ||
          !customer[field].trim()
      )
    ) {
      return res.status(400).json({
        message: "Please provide all required delivery details.",
      });
    }

    // Validate phone number and postal code
    if (
      !/^[0-9]{10}$/.test(customer.phone.trim()) ||
      !/^[0-9]{5,10}$/.test(customer.postalCode.trim())
    ) {
      return res.status(400).json({
        message: "Please enter a valid phone number and postal code.",
      });
    }

    // Validate cart items
    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 50
    ) {
      return res.status(400).json({
        message: "Your cart is empty or contains too many items.",
      });
    }

    if (paymentMethod !== "Cash on Delivery") {
      return res.status(400).json({
        message: "The selected payment method is not supported.",
      });
    }

    // Validate product IDs and quantities
    const quantities = new Map();

    for (const item of items) {
      if (
        !item ||
        typeof item.productId !== "string" ||
        !mongoose.isValidObjectId(item.productId) ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 100
      ) {
        return res.status(400).json({
          message: "One or more cart items are invalid.",
        });
      }

      const id = item.productId;
      quantities.set(id, (quantities.get(id) || 0) + item.quantity);

      if (quantities.get(id) > 100) {
        return res.status(400).json({
          message: "Maximum quantity per product is 100.",
        });
      }
    }

    // Fetch real product data from MongoDB
    const productIds = [...quantities.keys()];
    const products = await Product.find({
      _id: { $in: productIds },
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        message:
          "A product in your cart no longer exists. Please refresh your cart.",
      });
    }

    // Build order items using database prices, not client prices
    const orderItems = [];

    for (const product of products) {
      const quantity = quantities.get(product._id.toString());

      if (
        typeof product.price !== "number" ||
        !Number.isFinite(product.price) ||
        product.price < 0
      ) {
        return res.status(400).json({
          message: `Invalid price for ${product.name}.`,
        });
      }

      if (
        typeof product.stock === "number" &&
        product.stock < quantity
      ) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}.`,
        });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity,
        imageUrl: product.imageUrl || "",
      });
    }

    // Calculate total using database prices
    const totalAmount = Number(
      orderItems
        .reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        )
        .toFixed(2)
    );

    // Create and save the order
    const order = await Order.create({
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email:
          typeof customer.email === "string"
            ? customer.email.trim().toLowerCase()
            : "",
        address: customer.address.trim(),
        city: customer.city.trim(),
        state: customer.state.trim(),
        postalCode: customer.postalCode.trim(),
      },
      items: orderItems,
      totalAmount,
      paymentMethod,
    });

    return res.status(201).json({
      message: "Order placed successfully!",
      order: {
        _id: order._id,
        items: order.items,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      message: "Unable to place your order. Please try again.",
    });
  }
};

module.exports = { createOrder };