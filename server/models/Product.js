const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      maxlength: 1000,
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Electronics", "Fashion", "Home", "Accessories"],
      index: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number",
      },
    },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text" });
productSchema.index({ price: 1 });

module.exports = mongoose.model("Product", productSchema);