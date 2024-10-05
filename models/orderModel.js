const mongoose = require('mongoose');
const {v4:uuidv4}= require('uuid');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        
    },
    orderId:{
        type:String,
        default:()=>uuidv4(),
        unique:true
    },
    orderitems: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required:true
        },
        quantity: {
            type: Number,
            required: true,
           
        },
        originalQuantity: {
            type: Number, // New field to store original quantity
            required: true
        },
        status: {
            type: String,
            enum: ['Delivered', 'Shipping', 'Pending', 'Cancelled', 'Returned'],
            default: 'Pending'

        },
        orderPrice: {
            type: Number ,// Store the price at the time of ordering
            default:0
        }
    }],
    orderUserDetails: {
        type:Object,
        required: true
    },
    totalAmount: {
        type: Number,
        required:true
        
    },
    paymentMethod: {
        type: String,
        enum: ['wallet', 'Cash on Delivery', 'online'],
        required: true

    },
    orderDate: {
        type: Date,
        default: Date.now()
    },

    cancelReason: {
        type: String
    },
    cancellationComments: {
     type: String 
    },
    shippedDate: {
        type: Date
      },
      deliveryDate: {
        type: Date
      },
      cancelDate: {
        type: Date
      },
      returnDate: {
        type: Date
      },
    returnReason: {
        type: String
    },
    refundMode: {
      type: String
     }, 
    
    couponApplied: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
    },
    offerApplied: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer'
    },
    paymentStatus:{
     type: String   
    },
    discountamount:{
        type:Number,
        defualt:0
    },
    finalAmount:{
        type:Number,
        required:true
    },
  address:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Address',
    require:true
  },
  status:{
    type:String,
    required:true,
    enum:['Pending','Processing','Shipped','Delivered','Canclled','Return Request','Returned']
  },
  createdOn: {
    type: Date,
    default: Date.now // Store the created date
}
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order