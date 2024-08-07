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
             originalQuantity: Number // New field to store original quantity
            
            
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
        
    },
    totalAmount: {
        type: Number,
        required:true
        
    },
    paymentMethod: {
        type: String,
        enum: ['wallet', 'Cash on Delivery', 'online'],
        
    },
    orderDate: {
        type: Date,
        default: Date.now()
    },

    cancelReason: {
        type: String
    },
    returnReason: {
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
    finalAmout:{
        type:Number,
        required:true
    },
  address:{
    type:Schema.Types.ObjectId,
    ref:'User',
    require:true
  },
  status:{
    type:String,
    required:true,
    enum:['Pending','Processing','Shipped','Delivered','Canclled','Return Request','Returned']
  },
  createdOn:{
  type:Boolean,
  defualt:false
  }
});

module.exports = mongoose.model('Order', orderSchema);