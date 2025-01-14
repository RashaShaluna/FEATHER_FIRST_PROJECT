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
  
      const cartData = await Cart.findOne({ userId: user}).populate({
        path: 'items.productId',
        model: Product,
        populate: {
          path: 'category',
          model: Category
        },
        model: Product
      });
      
      
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

// ==================== guest cart ============================

const guestCart = async(req,res)=>{
  try{
  
  log('in guest cart');
  const categories = await Category.find({islisted:true,isDeleted:false});
  res.render('pages/cartForguest',{title:'Cart - Feather',categories});

  }catch(err){
    log(err);
    res.redirect('/pageNotFound');
  }
}




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

// const updateQuantity = async (req, res) => {
//   try {
//     log('in ')
//       const { productId } = req.params;  // Get productId from URL parameters
//       let quantity = parseInt(req.body.quantity);// Get updated quantity from request body

//      log(productId, 'product id in updateQuantity');
//      log('quantity in updateQuantity', quantity);   
//      console.log('User ID:', req.session.user);

//       log('in ')
//     log('in ')

//       // Find the cart for the current user and update the quantity of the specified product
//       const cart = await Cart.findOneAndUpdate(
//           { userId: req.session.user, 'item.productId': productId },
//           { $set: { 'item.$.quantity': quantity } }, // Update the quantity
//           { new: true } // Return the updated document
//       );
//        log(cart)
//       if (!cart) {
//           return res.status(404).json({ success: false, message: 'Cart not found' });
//       }

//      log(cart, 'updated cart');
//       res.json({ success: true, cart, message: 'Cart updated successfully' });
//   } catch (error) {
//      log(error);
//       res.status(500).json({ success: false, message: 'Server error' });
//   }
// }


// const updateQuantity = async (req, res) => {
//   try {
//     const { productId } = req.params;
//     const quantity = parseInt(req.body.quantity); 
//     const userId = req.session.user; 
//     console.log(productId, 'Product ID in updateQuantity');
//     console.log('Quantity in updateQuantity', quantity);
//     console.log('User ID:', userId);

//     const product = await Product.findById(productId);
//     const salesPrice = product.salesPrice; 

//     const totalPrice = quantity * salesPrice; 
//     const cart = await Cart.findOneAndUpdate(
//       { userId: userId, 'items.productId': productId },
//       { 
//         $set: { 
//           'items.$.quantity': quantity,
//           'items.$.totalPrice': totalPrice 
//         } 
//       },
//       { new: true } 
//     );

//     if (!cart) {
//       return res.status(404).json({ success: false, message: 'Cart not found' });
//     }

//     let  grandTotal= 0;

//     cart.items.forEach(item => {
//       const itemTotalPrice = Number(item.totalPrice); 
//       if (!isNaN(itemTotalPrice)) {
//          grandTotal+= itemTotalPrice; 
//       }
//     });

//     console.log('Grand Total Price:',  grandTotal);
//     cart. grandTotal=  grandTotal;
//     await cart.save();
//     return res.status(200).json({ success: true, cart,  grandTotal}); 

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ success: false, message: 'Server error' });
//   }
// };
  
const updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const quantity = parseInt(req.body.quantity); 
    const userId = req.session.user; 
    const cartPrice = req.body.cartPrice
    log(req.body  )
    console.log(productId, 'Product ID in updateQuantity');
    console.log('Quantity in updateQuantity', quantity);
    console.log('User ID:', userId);

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // const effectivePrice =cartPrice
    log('cart',cartPrice);

    const totalPrice = quantity * cartPrice; 
    log(totalPrice, 'total price');

    // Update the cart
    const cart = await Cart.findOneAndUpdate(
      { userId: userId, 'items.productId': productId },
      { 
        $set: { 
          'items.$.quantity': quantity,
          'items.$.totalPrice': totalPrice 
        } 
      },
      { new: true } 
    );

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    // Calculate the grand total for the cart
    let grandTotal = 0;
    cart.items.forEach(item => {
      const itemTotalPrice = Number(item.totalPrice); 
      if (!isNaN(itemTotalPrice)) {
        grandTotal += itemTotalPrice; 
      }
    });

    console.log('Grand Total Price:', grandTotal);
    cart.grandTotal = grandTotal;

    // Save the updated cart
    const result = await cart.save();
    log(result, 'updated cart');

    // Respond with success
    return res.status(200).json({ success: true, cart, grandTotal });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ================ Remove product from the cart ==================
const removeFromCart = async (req, res) => {
  const { productId } = req.body; 
  log(productId)
  const user = req.session.user;

  try {
      let cart = await Cart.findOne({ userId: user });
      if (!cart) return res.status(404).json({ message: 'Cart not found' });

     
      const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
          log(itemIndex)

if (itemIndex > -1) {
      cart.items.splice(itemIndex, 1); 

      await cart.save();

      return res.status(200).json({ message: "Product removed from cart successfully" });
    } else {
      return res.status(404).json({ message: 'Product not found in cart' });
    }
       
   } catch (error) {
      console.log('Error removing item from cart:', error);
      return res.status(500).json({ message: 'Server error' });
  }
};


  
  module.exports = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    guestCart
  }