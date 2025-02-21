const Wishlist = require("../models/wishlistModel");
const Product = require("../models/productModel");
const User = require("../models/userSchema");
const Category = require("../models/category");
const Cart = require("../models/cartModel");
const path = require("path");
const fs = require("fs");
const { log } = require("console");
const mongoose = require("mongoose");

const messages = {
  EXISTING_PRODUCT: "Product already in wishlist",
  PRODUCT_ADDED: "Product added to wishlist",
  WISHLIST_NOT_FOUND: "Wishlist not found",
  PRODUCT_REMOVED: "Product removed from wishlist",
};
// add to wishlist
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.session.user;

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = new Wishlist({ userId, products: [] });
    }

    const existingProduct = wishlist.products.find(
      (item) => item.productsId.toString() === productId
    );

    if (existingProduct) {
      return res
        .status(400)
        .json({ success: false, message: messages.EXISTING_PRODUCT });
    }

    wishlist.products.push({ productsId: productId });
    await wishlist.save();
    log("saved");
    res.json({ success: true, message: messages.PRODUCT_ADDED });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status("/serverError");
  }
};
// Remove from Wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.session.user;

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res.json({ success: false, message: messages.WISHLIST_NOT_FOUND });
    }

    wishlist.products = wishlist.products.filter(
      (item) => item.productsId.toString() !== productId
    );

    await wishlist.save();
    log("done");
    res.json({ success: true, message: messages.PRODUCT_REMOVED });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.redirect("/serverError");
  }
};

const getWishlist = async (req, res) => {
  try {
    const userId = req.session.user;

    const [wishlist, categories, cart] = await Promise.all([
      Wishlist.findOne({ userId }).populate({
        path: "products.productsId",
        model: Product,
        populate: {
          path: "category",
          model: Category,
        },
      }),
      Category.find({ islisted: true, isDeleted: false }),
      Cart.findOne({ userId }).populate({
        path: "items.productId",
        model: Product,
      }),
    ]);

    res.render("users/wishlist", {
      cart: cart || { items: [] },
      categories,
      wishlist: wishlist || { products: [] },
      title: "Wishlist - Feather",
    });
  } catch (error) {
    console.error("Error getting wishlist:", error);
    res.redirect("/serverError");
  }
};
module.exports = {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
};
