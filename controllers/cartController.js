const User = require('../models/userSchema');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const Category = require('../models/category');
const {log} = require('console');
const env = require('dotenv').config();

// ======================== cart ===============================================
const cart = async (req, res) => {
  try {

  log('in cart page')
  console.log('Session user:', req.session.user);
    const user = req.session.user;
    const categories = await Category.find({ islisted: true, isDeleted: false });

    log(user);
    if (!user) {
      return res.status(401).json({ message: 'User not logged in' });
    }
  
      // Find user's cart
      const cartData = await Cart.findOne({ userId: user}).populate({
        path: 'items.productId',
        model: Product
      });
      
      
   // If the user has no cart, initialize an empty cartData
   if (!cartData) {
    return res.render('users/cart', {
      title: 'Cart - Feather',
      user,
      products:  [],
      categories
    });
  }
  const filteredProducts = cartData.items.filter(item => {
    const product = item.productId;
    return product && !product.isBlocked && !product.isDeleted;
  });

  log(cartData)
      res.render('users/cart', {
        title: 'Cart - Feather',
        user,
      products: filteredProducts,
        categories
      });
    } catch (error) {
      log(error);
      res.redirect('/serverError');
    }
  };



// ========================================= add cart ===================
const addToCart = async (req, res) => {
  try {
    log('Adding to cart');
    const { productId, quantity = 1 } = req.body; 
    log('Request body:', req.body);
    log('Received productId:', productId);

    const user = req.session.user;
    log('User:', user);
    if (!user) {
      return res.status(401).json({ message: 'User not logged in' });
    }

    let cart = await Cart.findOne({ userId: user });
    if (!cart) {
      cart = new Cart({ userId: user, items: [] });
    }

    const existingProductIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (existingProductIndex >= 0) {
      cart.items[existingProductIndex].quantity += parseInt(quantity);
    } else {
      if (!productId) {
        return res.status(400).json({ message: 'Product ID is required' });
      }
      cart.items.push({ productId, quantity: parseInt(quantity) });
    }

    await cart.save();
    log('Saved cart:', cart);
    return res.json({ success: true, message: 'Product added to cart' });
  } catch (error) {
    console.log('Error adding product to cart:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


// =============================== update quantity ==============================

const updateQuantity = async (req, res) => {
  try {
    log('in ')
      const { productId } = req.params; // Get productId from URL parameters
      let quantity = parseInt(req.body.quantity);// Get updated quantity from request body

     log(productId, 'product id in updateQuantity');
     log('quantity in updateQuantity', quantity);   
     console.log('User ID:', req.session.user);

      log('in ')
    log('in ')

      // Find the cart for the current user and update the quantity of the specified product
      const cart = await Cart.findOneAndUpdate(
          { userId: req.session.user, 'products.productId': productId },
          { $set: { 'products.$.quantity': quantity } }, // Update the quantity
          { new: true } // Return the updated document
      );

      if (!cart) {
          return res.status(404).json({ success: false, message: 'Cart not found' });
      }

     log(cart, 'updated cart');
      res.json({ success: true, cart, message: 'Cart updated successfully' });
  } catch (error) {
     log(error);
      res.status(500).json({ success: false, message: 'Server error' });
  }
}












const removeFromCart = async (req, res) => {
  const { productId } = req.body; // Use req.body to get the productId
  log(productId)
  const user = req.session.user;

  try {
      // Find the cart for the logged-in user
      let cart = await Cart.findOne({ userId: user });
      if (!cart) return res.status(404).json({ message: 'Cart not found' });

      // Find the index of the item to be removed
     
      const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
          log(itemIndex)

          if (itemIndex > -1) {
            cart.items.splice(itemIndex, 1); // Remove the product from the cart
      
            // Save the updated cart
            await cart.save();
      
            return res.status(200).json({ message: "Product removed from cart successfully" });
          } else {
            return res.status(404).json({ message: 'Product not found in cart' });
          }
        // Save the updated cart
          await cart.save();
          log('cart');

        return res.status(200).json({ message: "Product removed from cart successfully" });

   } catch (error) {
      console.log('Error removing item from cart:', error);
      return res.status(500).json({ message: 'Server error' });
  }
};

// Router setup

  
  module.exports = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity
  }