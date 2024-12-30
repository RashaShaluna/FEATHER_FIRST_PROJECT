const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    couponName: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    // description: {
    //     type: String
    // }, 
    startDate:{
        type: Date
    },
    expireDate: {
        type: Date
    },
    discountAmount: {
        type: Number
    },
    minPurchaseAmount: {
        type: Number  
    },
    maxDiscountLimit: {
        type: Number 
    },
    active: {
        type: Boolean,
        default: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        
    },isDeleted: { 
        type: Boolean,
         default: false 
},

});

module.exports = mongoose.model('Coupon', couponSchema);