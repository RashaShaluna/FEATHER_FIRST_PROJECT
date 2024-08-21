    const mongoose = require('mongoose');
   const {Schema} = mongoose;

   const categorySchema =  new Schema({
    name:{
        type:String,
        required:true,
        unique: true
    },
    description:{
        type:String,
        required:true
    },
    islisted:{
        type:Boolean,
        // required:true,
        default: true,
        // sparse: true,
    },
    categoryOffer:{
        type:Number,
        required:true,
        default :0
    }
   })
   
   const Category = mongoose.model('Category',categorySchema);
   module.exports = Category;