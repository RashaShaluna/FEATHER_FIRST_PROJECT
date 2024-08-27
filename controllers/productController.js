const Product = require('../models/productModel');
const Category = require('../models/category');
const User = require('../models/userSchema');
const fs = require('fs');
const path = require('path');
const {log} = require('console');
const multer = require('multer');
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
            res.render('admin/pruductadding',{category,title:'Add Prodcut - Feather'});
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
  


// const productAdding = async(req,res)=>{
//   try {
//           log('in add')

//     const product = req.body;
//     // const arrImages = [];
//       log('in add')
      
//     //  adding images to the array
//     // for (let i = 0; i < req.files.length; i++) {
//     //   arrImages[i] = req.files[i].filename;
//     // }
//   //   const image = new ImageModel({
//   //     imagePath: `/uploads/${req.file.filename}`,
//   //     // You can add other fields here if needed
//   // });

//     log('in add')

//     const existingProduct = await Product.findOne({name:product.name,category:product.categerory});
//     log('in add')

//     if(existingProduct){
//       return res.status(400).json({ success: false, message: 'Product already exists' });

//     };

//     // createing new product
//    const newProduct = new Product({
//       name: product.name,
//       price: product.price,
//       description: product.description,
//       brand: product.brand,
//       category: product.category, 
//       quantity: product.quantity,
//       offerprice: product.offerprice,
//       color:product.color,
//       images: image, 
//     });
//     const productData= await newProduct .save();
//       // res.status(200).json({success:true,message:'Product added ',data:productData});
//       res.status(200).send('Product added successfully with images');

//   } catch (error) {
//     log('error',error);
//     res.status(400).json({success:false,message:'Server error '})
//   }
// }


const productAdding = async (req, res) => {
  try {
   log('in add')
   log('Request Body:', req.body);
   log('Uploaded Files:', req.files);
   
    const { name, price, description, brand, category, quantity, offerprice, color } = req.body;
    const images = req.files.map(file => `uploads/${file.filename}`); // Array of image paths
    log('in add')

    // Check for existing product
    const existingProduct = await Product.findOne({ name: { $regex: `${name}`, $options: 'i' }, category });
    if (existingProduct) {
      return res.status(400).json({ success: false, message: 'Product already exists' });
    }
    log('in add')
    console.log('name price offerprice images:',name, price, offerprice, images);
    // Create new product
    const newProduct = new Product({
      name,
      price,
      description,
      brand,
      category,
      quantity,
      price,
      offerprice,
      color,
      images, // Array of image paths
    });


    const productData = await newProduct.save();
    log('in saved')

    console.log('product',productData)
    res.status(200).send('Product added successfully with images');

  } catch (error) {
   log('Error:', error);
    res.status(400).json({ success: false, message: 'Server error' });
  }
};







module.exports = {
    productPage,
    addproductpage,
    productAdding

}