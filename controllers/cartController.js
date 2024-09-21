const User = require('../models/userSchema');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const Category = require('../models/category');
const {log} = require('console');
const env = require('dotenv').config();

const addToCart = async (req, res) => {
    log('in cart');
    const { productId, quantity } = req.body;
    log('ProductId:', productId, 'Quantity:', quantity);
  
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ message: 'User not logged in' });
    }
  
    log('User ID:', user._id); // Ensure you're logging the user ID
  
    try {
      // Find the product by ID
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      const price = product.offerprice * quantity;
      log('Price:', price);
  
      // Find user's cart
      let cart = await Cart.findOne({ userId: user });
      log('Cart:', cart);
  
      if (cart) {
        // If cart exists, update the cart
        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex > -1) {
          cart.items[itemIndex].quantity += quantity;
          cart.items[itemIndex].price += price;
        } else {
          cart.items.push({ productId, quantity, price });
        }
      } else {
        // If no cart exists, create a new cart
        cart = new Cart({
          userId: user, // Use user._id to store only the user ID
          items: [{ productId, quantity, price }],
          totalPrice: price, // Set initial total price as price
        });
        log('New cart created');
      }
  
      cart.totalPrice += price;
  
      // Save the cart
      const savedCart = await cart.save();
      log('Cart saved successfully:', savedCart);
      res.status(200).json(savedCart);
    } catch (error) {
      log('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
const removeFromCart = async (req, res) => {
    const { productId } = req.params;
    const userId = req.user._id;
  
    try {
      let cart = await Cart.findOne({ userId });
      if (!cart) return res.status(404).json({ message: 'Cart not found' });
  
      const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
      if (itemIndex > -1) {
        cart.totalPrice -= cart.items[itemIndex].price;
        cart.items.splice(itemIndex, 1);
        await cart.save();
        res.status(200).json(cart);
      } else {
        res.status(404).json({ message: 'Item not found in cart' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  module.exports = {
    addToCart,
    removeFromCart
  }