const User = require("../models/userSchema");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const Category = require("../models/category");
const { log } = require("console");
const env = require("dotenv").config();

const messages = {
  USER_NOT_LOGGED: "User not logged in",
  PRODUCT_ID_REQUIRED: "Product ID is required",
  PRODUCT_ADDED_TO_CART: "Product added to cart successfully",
  PRODUCT_NOT_FOUND: "Product not found",
  CART_NOT_FOUND: "Cart not found",
  PRODUCT_REMOVED: "Product removed from cart successfully",
};
// ======================== cart ===============================================
const cart = async (req, res) => {
  try {
    const user = req.session.user;
    const categories = await Category.find({
      islisted: true,
      isDeleted: false,
    });

    log(user);
    if (!user) {
      return res.json({ message: messages.USER_NOT_LOGGED });
    }

    const cartData = await Cart.findOne({ userId: user }).populate({
      path: "items.productId",
      model: Product,
      populate: {
        path: "category",
        model: Category,
      },
      model: Product,
    });

    if (!cartData) {
      return res.render("users/cart", {
        title: "Cart - Feather",
        user,
        products: [],
        categories,
      });
    }
    const filteredProducts = cartData.items.filter((item) => {
      const product = item.productId;
      return product && !product.isBlocked && !product.isDeleted;
    });

    log(cartData);
    res.render("users/cart", {
      title: "Cart - Feather",
      user,
      products: filteredProducts,
      categories,
    });
  } catch (error) {
    log(error);
    res.redirect("/serverError");
  }
};

// ==================== guest cart ============================

const guestCart = async (req, res) => {
  try {
    const categories = await Category.find({
      islisted: true,
      isDeleted: false,
    });
    res.render("pages/cartForguest", { title: "Cart - Feather", categories });
  } catch (err) {
    log(err);
    res.redirect("/pageNotFound");
  }
};

// ========================================= add cart ===================
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const user = req.session.user;

    let cart = await Cart.findOne({ userId: user });
    if (!cart) {
      cart = new Cart({ userId: user, items: [] });
    }

    const existingProductIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );
    if (existingProductIndex >= 0) {
      cart.items[existingProductIndex].quantity += parseInt(quantity);
    } else {
      cart.items.push({ productId, quantity: parseInt(quantity) });
    }

    await cart.save();
    log("Saved cart:", cart);
    return res.json({ success: true, message: messages.PRODUCT_ADDED_TO_CART });
  } catch (error) {
    console.log("Error adding product to cart:", error);
    res.redirect("/serverError");
  }
};

// =============================== update quantity ==============================

const updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const cartQuantity = parseInt(req.body.cartQuantity);
    const userId = req.session.user;
    const cartPrice = parseFloat(req.body.cartPrice);

    const product = await Product.findById(productId);

    const availableStock = product.quantity;

    const totalPrice = cartQuantity * cartPrice;

    const cart = await Cart.findOneAndUpdate(
      { userId: userId, "items.productId": productId },
      {
        $set: {
          "items.$.quantity": cartQuantity,
          "items.$.totalPrice": totalPrice,
        },
      },
      { new: true }
    );

    let grandTotal = cart.items.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0
    );
    cart.grandTotal = grandTotal;
    await cart.save();

    return res.json({ success: true, cart, grandTotal });
  } catch (error) {
    console.error(error);
    res.redirect("/serverError");
  }
};

// ================ Remove product from the cart ==================

const removeFromCart = async (req, res) => {
  const { productId } = req.body;
  const user = req.session.user;

  try {
    let cart = await Cart.findOne({ userId: user });

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex > -1) {
      cart.items.splice(itemIndex, 1);

      await cart.save();

      return res.json({ message: messages.PRODUCT_REMOVED });
    } else {
      res.redirect("/pageNotFound");
    }
  } catch (error) {
    console.log("Error removing item from cart:", error);
    res.redirect("/serverError");
  }
};

module.exports = {
  cart,
  addToCart,
  removeFromCart,
  updateQuantity,
  guestCart,
};
