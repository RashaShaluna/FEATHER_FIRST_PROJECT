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
    },
    isDeleted:{
        type:Boolean,
        default:false,
    },
    deletedAt:{
        type:Date,
        default:null,
    },
    offerPercentage: {
        type: Number, 
        default: null, 
        set: (value) => (value === '' ? null : value),
      },
    isOfferActive: {
        type: Boolean,
        default: false,
      },
    offerStartDate: {
        type: Date,
      },
    offerEndDate: {
        type: Date,
      },
    
     
   })






   categorySchema.pre('save', function(next) {
    if (this.name && (!this.slug || this.isModified('name'))) {
      this.slug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')         // Replace spaces with hyphens
        .replace(/-+/g, '-');         // Remove consecutive hyphens
    }
    next();
  });
   const Category = mongoose.model('Category',categorySchema);
   module.exports = Category;