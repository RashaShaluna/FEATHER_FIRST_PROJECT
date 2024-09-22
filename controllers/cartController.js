const User = require('../models/userSchema');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const Category = require('../models/category');
const {log} = require('console');
const env = require('dotenv').config();

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

// const addToCart = async (req, res) => {

//     log('in cart');
//     const { productId, quantity } = req.body;
//     log('ProductId:', productId, 'Quantity:', quantity);
  
//     const user = req.session.user;
//     if (!user) {
//       return res.status(401).json({ message: 'User not logged in' });
//     }
//   log(user)
//     log('User ID:', user._id); // Ensure you're logging the user ID
  
//     try {
//       // Find the product by ID
//       const product = await Product.findById(productId);
//       if (!product) {
//         return res.status(404).json({ message: 'Product not found' });
//       }
  
//       const price = product.offerprice * quantity;
//       log('Price:', price);
  
//       // Find user's cart
//       let cart = await Cart.findOne({ userId: user._id });
//       log('Cart:', cart);
  
//       if (cart) {
//         // If cart exists, update the cart
//         const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
//         if (itemIndex > -1) {
//           cart.items[itemIndex].quantity += quantity;
//           cart.items[itemIndex].price += price;
//         } else {
//           cart.items.push({ productId, quantity, price });
//         }
//       } else {
//         // If no cart exists, create a new cart
//         cart = new Cart({
//           userId: user._id, // Use user._id to store only the user ID
//           items: [{ productId, quantity, price }],
//           totalPrice: price, // Set initial total price as price
//         });
//         log('New cart created');
//       }
  
//       cart.totalPrice += price;
  
//       // Save the cart
//       const savedCart = await cart.save();
//       log('Cart saved successfully:', savedCart);
//       res.status(200).json(savedCart);
//     } catch (error) {
//       log('Error:', error);
//       res.status(500).json({ message: 'Server error' });
//     }
//   };

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
    cart,
    addToCart,
    removeFromCart
  }