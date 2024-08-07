    const mongoose = require('mongoose');
   const {Schema} = mongoose;

   const categorySchema =  new Schema({
    categoryname:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    isListed:{
        type:Boolean,
        required:true
    },
    categoryOffer:{
        type:Number,
        required:true,
        default :0
    }
   })
   
   const Category = mongoose.model('Category',userSchema);
   module.exports = Category;