const mongoose = require('mongoose');
const {Schema} = mongoose;

    const cartScehma = mongoose.Schema({
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        itmes: [{
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
    });
    // here im  not added the cancellation reason and the status 







const Cart = mongoose.model('Cart',cartScehma);
   module.exports = Cart;