const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        // required: true,
        unique: true,
        sparse: true,
    },
    phone:{
        type: String,
        unique:true,
        sparse:true,
    },
  password: {
        type: String,
        required: false
    },
    googleid:{
        type:String,
        index: true,
        unique: true,
        sparse: true,
    },
    facebookId: {
        type: String,
        unique: true,
        sparse: true,
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    wishlist:[{
        type:Schema.Types.ObjectId,
        ref:'Wishlist',
    }],
    cart: [{
        type: Schema.Types.ObjectId,
        ref: 'Cart'
    }],
    wallet: [{
        type: Schema.Types.ObjectId,
        ref: 'Wallet'
    }],
    orderHistory: [{
        type: Schema.Types.ObjectId,
        ref: 'Order'
    }],
    createdOn: {
        type: Date,
        default: Date.now
    },
    referralCode: {
        type: String
    },
    redeemed: {
        type: Boolean
    },
    redeemedUsers: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    searchHistory: [{
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category'
        },
       
        searchOn: {
            type: Date,
            default: Date.now
        }
    }],
    addresses:  [{
    type: Schema.Types.ObjectId, 
      ref: 'Address'
     }],
});

const User = mongoose.model('User', userSchema);
module.exports = User;
