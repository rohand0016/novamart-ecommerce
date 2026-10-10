require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Product = require("./models/Product");

const products = [
  {
    name: "Studio Wireless Headphones",
    description: "Immersive sound and all-day comfort for work and travel.",
    price: 3499,
    category: "Electronics",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700",
    stock: 25,
  },
  {
    name: "Minimal Everyday Watch",
    description: "A clean, timeless design that works with every outfit.",
    price: 2299,
    category: "Accessories",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700",
    stock: 18,
  },
  {
    name: "Classic Everyday Sneakers",
    description: "Versatile everyday footwear with a comfortable fit.",
    price: 2799,
    category: "Fashion",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700",
    stock: 32,
  },
  {
    name: "Modern Table Lamp",
    description: "Warm, ambient lighting for a calm and inviting space.",
    price: 1899,
    category: "Home",
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=700",
    stock: 14,
  },
  {
    name: "Everyday Travel Backpack",
    description: "A practical carry-all for commutes, classes, and weekends.",
    price: 1599,
    category: "Accessories",
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700",
    stock: 20,
  },
  {
    name: "Compact Bluetooth Speaker",
    description: "Bring your favorite playlists to your desk or living room.",
    price: 1999,
    category: "Electronics",
    imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=700",
    stock: 12,
  },
  {
    name: "Ceramic Coffee Mug",
    description: "A simple ceramic mug for your daily coffee ritual.",
    price: 399,
    category: "Home",
    imageUrl: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=700",
    stock: 40,
  },
  {
    name: "Polarized Sunglasses",
    description: "An easy finishing touch for sunny days outdoors.",
    price: 999,
    category: "Fashion",
    imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=700",
    stock: 16,
  },
  {
    name: "Wireless Computer Mouse",
    description: "A compact, reliable companion for your workspace.",
    price: 799,
    category: "Electronics",
    imageUrl: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=700",
    stock: 22,
  },
  {
    name: "Soft Cushion Cover",
    description: "Add a subtle, cozy accent to your favorite room.",
    price: 499,
    category: "Home",
    imageUrl: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=700",
    stock: 28,
  },
  {
    name: "Canvas Tote Bag",
    description: "A lightweight everyday bag for essentials and errands.",
    price: 599,
    category: "Fashion",
    imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=700",
    stock: 30,
  },
  {
    name: "Desk Organizer",
    description: "Keep everyday stationery and small essentials in order.",
    price: 699,
    category: "Accessories",
    imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=700",
    stock: 11,
  },
];

async function seedProducts() {
  try {
    await connectDB();

    await Product.deleteMany({});
    await Product.insertMany(products);

    console.log(`${products.length} sample products added successfully.`);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedProducts();