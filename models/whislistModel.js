const mongoose = require('mongoose');
   const {Schema} = mongoose;

const wishlistSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    products:[{
        productsId:
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
    }]
})
const Whislist = mongoose.model('Whislist',userSchema);
   module.exports = Whislist;
  