const mongoose = require('mongoose');
const { Schema } = mongoose;

const cartSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      default: 1
    }
  }],
  totalPrice: {
    type: Number,
    required: true,
    default: 0
  },
  grandTotal:{
    type: Number,
    required: true,
    default: 0
  }
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
