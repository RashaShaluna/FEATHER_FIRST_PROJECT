const Product = require('../models/productModel');
const Category = require('../models/category');
const User = require('../models/userSchema');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); 
const {log} = require('console');
const multer=require('multer');
const { search } = require('../routes/adminRouter');

// =========================================== Product page ===================================================================
const productPage = async(req,res)=>{
    try {
        console.log('in product page');
        
       let search = '';
       if(req.query.search){
        search = req.query.search;
       }

        const category = await Category.find({islisted:true ,isDeleted:false});
        const product = await Product.find({
        name:{$regex:search ,$options:'i'},
        }).sort({name:-1});

        console.log('product',product);
        res.render('admin/product',
        {title:'Product - Feather',
        // {cat:category}
        searchQuery:search
    });
    } catch (error) {
        console.log('error',error);
        res.redirect('/admin/pageerror');
    }
}

// ================================================================= Add product  page =================================================

const addproductpage = async(req,res)=>{
         try {
          log('in add product page')
            const category = await Category.find({islisted:true ,isDeleted:false});
            console.log('Fetched Categories:', category);
            res.render('admin/addProducts',{category,title:'Add Prodcut - Feather'});
         } catch (error) {
            console.log(error);
            res.redirect('/admin/pageerror');
         }
}

// ================================================== Adding product ==============================================================================

// const productAdding = async (req, res) => {
//     try {
//       log('in 1')
//       const products = req.body;
//       const productExists = await Product.findOne({
//         productName: products.productName,
//       });
//       log('in 1')
//       if (!productExists) {
//         const images = [];
//         log('in 1')
//         if (req.files && req.files.length > 0) {
//           for (let i = 0; i < req.files.length; i++) {
//             const originalImagePath = req.files[i].path;
//             const resizedImagePath = path.join();
  
//             await sharp(originalImagePath)
//               .resize(800, 600)
//               .toFile(resizedImagePath);
  
//             images.push(req.files[i].filename);
//           }
//         }
//         log('in 1')
//         const categoryId = await Category.findOne({ name: products.category });
//         log('in 1')
//         if (!categoryId) {
//           return res.status(400).json("Invalid category name");
//         }
//         log('in 1')
//         const newProduct = new Product({
//           productName: products.productName,
//           description: products.description,
//           brand: products.brand,
//           category: categoryId._id,
//           price: products.price,
//           offerPrice: products.offerPrice,
//           createdOn: new Date(),
//           quantity: products.quantity,
//         //   color: products.color,
//           productImage: images,
//           status: 'Available',
//         });
//         log('in 1')
//         // console.log('Product Name:', productName);
//         console.log('Description:', description);
//         console.log('Price:', price);
//         console.log('Sale Price:', salePrice);
//         console.log('Quantity:', quantity);
//         // console.log('Category:', category);
//         console.log('Images:', images.map(file => file.path));
//         await newProduct.save();
//         return res.redirect('admin/addP',{title:'product'})
//       }else{
//         return res.status(400).json('Product already exists,try with another name')
//       }
//     } catch (error) {
//       console.error(error);
//       return res.redirect('/admin/pageerror');
//     }
//   };
  


const productAdding = async(req,res)=>{
  try {
    const product = req.body;
    const arrImages = [];
    
    //  adding images to the array
    for (let i = 0; i < req.files.length; i++) {
      arrImages[i] = req.files[i].filename;
    }

    const existingProduct = await Product.findOne({name:product.name,category:product.categerory});

    if(existingProduct){
      return res.status(400).json({ success: false, message: 'Product already exists' });

    };

    // createing new product
   const newProduct = new Product({
      name: product.name,
      price: product.price,
      description: product.description,
      brand: product.brand,
      category: product.category, 
      quantity: product.quantity,
      offerprice: product.offerprice,
      color:product.color,
      images: arrImages, 
    });
    const productData= await newProduct .save();
      res.status(200).json({success:true,message:'Product added ',data:productData});
  } catch (error) {
    res.status(400).json({success:false,message:'Server error '})
  }
}









module.exports = {
    productPage,
    addproductpage,
    productAdding,

}