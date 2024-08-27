const mongoose = require('mongoose');

const {Schema} = mongoose;

const productSchema = new Schema ({
    name:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required : true
    },
    images : {
        type:Array,
        required:true,
    },
    description:{
        type:String,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    quantity: {
        type: Number,
        required: true
    },
    status:{
        type:String,
       enum:['In stock','Out of stock'],
       required:true,
       default:'In stock'
    },
    color:{
        type:String,
        required:true
    },offerprice: {
        type: Number,
        required: true
    }
    
},{timestamps:true})

const Product = mongoose.model('product',productSchema);
module.exports = Product;