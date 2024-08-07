const mongoose = require('mongoose');

const{Schema} = mongoose;


const addressSchema = new Schema ({
   name:{
    type:String,
    required:true
   },
   phone:{
    type:Number,
    requiredLtrue
   },
   streetAdress:{
    type:String,
    required:true
   },
   pincode:{
    type:Number,
    required:true
   },
   district:{
    type:String,
    required:true,
   },
   locality:{
    type:String,
    required:true,
   },
    State:{
        type:String,
        required:true,
    },
    landmark:{
        type:String,
    },
    alnum:{
        type:Number,
        required:true
    }
})

const Address = mongoose.model('Address',addressSchema);
module.exports = Address;