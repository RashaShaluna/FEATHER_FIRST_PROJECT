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
    image : {
        type:Array,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    brand:{
        type:String,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    quantiti:{
        type:String,
        required:true
    },
    status:{
        type:Boolean,
       enum:['In stock','Out of stock'],
       required:true,
       default:'Available'
    },
    color:{
        type:String,
        required:true
    },
    offerprice:{
        type:String,
        required:true,
    }
},{timestamps:true})

const Product = mongoose.Model('product',productSchema);
module.exports = Product;