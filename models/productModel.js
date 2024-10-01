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
        type: Schema.Types.ObjectId, 
        ref: 'Category' ,
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
    },
    salesPrice:{
        type:Number,
        required:true
    },
    offerprice: {
        type: Number,
        required: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    createdOn: {
        type: Date,
        default: Date.now
    },
    isDeleted:{
        type:Boolean,
        default:false,
    },
    deletedAt:{
        type:Date,
        default:null,
    }
    
},{timestamps:true})

const Product = mongoose.model('product',productSchema);
module.exports = Product;