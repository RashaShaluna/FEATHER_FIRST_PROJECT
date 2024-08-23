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
        required:true,
        // validate:[arrayLimit,'You can pass only 4 images']
    },
    description:{
        type:String,
        required:true
    },
    // brand:{
    //     type:String,
    //     required:true
    // },
    category:{
        type:String,
        required:true
    },
    quantity:{
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

const Product = mongoose.model('product',productSchema);
module.exports = Product;