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
       
        originalQuantity: {
            type: Number, 
            required: true
        },
        cancelReason: {
            type: String
        },
        cancellationComments: {
         type: String 
        },
        returnReason: {
            type: String
        },
        refundMode: {
          type: String
         }, 
        
        status: {
            type: String,
            enum:['Pending','Processing','Shipped','Delivered','Cancelled','Return Request','Returned','Refunded'],
            default: 'Pending'

        },
        orderDate: {
            type: Date,
            default: Date.now()
        },
          returnDate: {
            type: Date
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
          estimatedDeliveryDate:{
            type:Date
        },
         productPrice:{  // this is what that the product that ordered for price
            type:Number,
            default:0
         }
        
    }],
    orderQuantity: {
      type: Number,
      required: true,
     
  },
    returnReason: {
        type: String
    },
    refundMode: {
        type: String
       },  
      orderPrice: {    // this what the order price that means price of all product in a order
          type: Number ,
          default:0
      },
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
    returnDate: {
      type: Date
    },
   shippedDate: {
     type: Date
    },
    deliveredDate: {
      type: Date
    },
    cancelDate: {
      type: Date
    },
    processingDate:{
     type:Date
    },
        //   deliveryDate:{ //its like a just estimate delivery date only 
        //     type:Date
        //   },
    estimatedDeliveryDate:{
        type:Date
    },
    cancelReason: {
        type: String
    },
    cancellationComments: {
     type: String 
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
  address:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Address',
    require:true
  },
  status:{
    type:String,
    required:true,
    enum:['Pending','Processing','Shipped','Delivered','Cancelled','Return Request','Returned','Refunded']
  },
  createdOn: {
    type: Date,
    default: Date.now // Store the created date
}
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order