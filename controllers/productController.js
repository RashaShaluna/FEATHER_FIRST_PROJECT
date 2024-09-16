const Product = require('../models/productModel');
const Category = require('../models/category');
const User = require('../models/userSchema');
const fs = require('fs');
const path = require('path');
const {log} = require('console');
const multer = require('multer');
const mongoose = require('mongoose')
const env = require('dotenv').config();

// =========================================== Product page ===================================================================
const productPage = async(req,res)=>{
    try {
        console.log('in product page');
        
       let search = '';
       if(req.query.search){
        search = req.query.search;
       }
       const category = await Category.find({islisted:true ,isDeleted:false});
      //  console.log('Fetched Categories:', category);

       const product = await Product.find({
        isDeleted: false, 
        $or: [
          { name: { $regex: search, $options: 'i' } },
          // { category: { $regex: search, $options: 'i' } },
          { color: { $regex: search, $options: 'i' } },
          
        ]
      }).populate('category').sort({ name: -1 });

        if(category){
          console.log('product',product);
          res.render('admin/product',
          {title:'Product - Feather',
          searchQuery:search,
          data:product});
        }else{
          res.redirect('/admin/pageerror')
        }

       
    } catch (error) {
        console.log('error',error);
        res.redirect('/admin/pageerror');
    }
}

// ================================================================= Add product  page =================================================

const   addproductpage = async(req,res)=>{
         try {
          log('in add product page')
            const category = await Category.find({islisted:true ,isDeleted:false});
            // console.log('Fetched Categories:', category);
            res.render('admin/addProduct',{category,title:'Add Product - Feather'});
         } catch (error) {
            console.log(error);
            res.redirect('/admin/pageerror');
         }
}

// ================================================== Adding product ==============================================================================



const productAdding = async (req, res) => {
  try {
   log('in add')
   log('Request Body:', req.body);
   log('Uploaded Files:', req.files);
   
    const { name, price, description, brand, category, quantity, offerprice, color } = req.body;
    // const images = req.files.map(file => `uploads/${file.filename}`); 
    const images = req.files.map(file => `${file.filename}`); 

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
      images, 
    });


    const productData = await newProduct.save();
    log('in saved')

    console.log('product',productData)
    res.status(200).json({ success: true, message: 'Product added' });

  } catch (error) {
   log('Error:', error);
    res.status(400).json({ success: false, message: 'Server error' });
  }
};


// ===================================== Stock ===============================================

const instockProduct = async(req,res)=>{
  try {
    let id = req.query.id;
    await Product.updateOne({_id:id},{$set:{status :'In stock'}});
    res.redirect('/admin/product');
  } catch (error) {
    console.log(error)
    res.redirect('/admin/pageerror');
  }
}


// =====================================Out Stock ===============================================

const outstockProduct = async(req,res)=>{
  try {
    let id = req.query.id;
    await Product.updateOne({_id:id},{$set:{status :'Out of stock'}});
    res.redirect('/admin/product');  
  } catch (error) {
    console.log(error)
    res.redirect('/admin/pageerror');
  }
}


//================================ Block user ==========================
const productBlocked = async(req,res)=>{
  try {
      let id = req.query.id;
      await Product.updateOne({_id:id},{$set:{isBlocked:true}});
      res.redirect('/admin/product');
  } catch (error) {
      console.error('Error blocking Product:', error);
      res.redirect('/admin/pageerror')
  }
}

// =============================unblock Product =====================================================================
const productUnBlock =async(req,res)=>{
  try {
    let id = req.query.id;
    await Product.updateOne({_id:id},{$set:{isBlocked :false}});
    res.redirect('/admin/product');
  }catch(error){
      console.error('Error blocking Product:', error);

   res.redirect('/admin/pageerror');
  }
}


// ============================= Delete Product =====================================================================

const softDeleteProduct = async (req, res) => {
  try {
    log('in delete one')
    log('req',req.params.productId)

    const productId = req.params.productId;
    log(productId)

    
    const updateResult = await Product.updateOne(
      { _id: productId },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );
    // console.log("Update result:", updateResult);


    if (updateResult.modifiedCount > 0) {
      res.json({ success: true, message: 'Product deleted successfully' });
    } else {
      res.json({ success: false, message: 'Product not found or already deleted' });
    }
    
  } catch (error) {
    console.error("Error deleting product", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



// =========================================== edit product page ===============================================

  const editProduct = async(req,res)=>{
    try {
      log('in page edit')
      console.log('Product ID:', req.params.id);
      const productId = req.params.id;
      log('productid',productId);
      
      const isValidObjectId = mongoose.Types.ObjectId.isValid(productId);
      if (!isValidObjectId) {
        console.error('Invalid Product ID format');
        return res.status(400).send('Invalid Product ID');
      }


      const product = await Product.findById(productId);
      const categories = await Category.find();
      // console.log('Product:', product);
      if (!product) {
        return res.status(404).send('Product not found');
      }
      res.render('admin/editProduct',{title:'Edit product', product, category: categories})
    } catch (error) {
      console.error(error);
      res.redirect('/admin/pageerror');
    }
  }

  // =========================================== edit product ===============================================

  // const editingProduct = async(req,res)=>{
  //   try {
  //     log('product editing')
  //     const productId = req.params.id;
  //     log('product id',productId);
  //     const uploadedImages = req.files;
  //     log('Uploaded Images:', uploadedImages);

  //   let imagePaths = [];
  //   const products = await Product.find({isBlocked:false,isDeleted:false,  _id: productId,
  //   });

  //   const category = await Category.findOne({ name: req.body.category ,isDeleted:false,islisted:false});
  // if(!category){
  //   res.redirect('/admin/pageerror');
  // }
  // // const categoryId = category._id;

  //       log('1')
  //       if (uploadedImages && uploadedImages.length > 0) {
  //         for (let i = 0; i < uploadedImages.length; i++) {
  //           const file = uploadedImages[i];
  //           const filePath = path.join('public/uploads', file.filename);
  //           const outputFilePath = path.join('public/uploads', `cropped_${file.filename}`);
  //           imagePaths.push(`cropped_${file.filename}`);
  //           fs.unlinkSync(filePath);
  //         }
  //       }
  //        log('2')

        
  //       const updatedProduct = {
  //         name: req.body.name,
  //         category: req.body.category,
  //         price: parseFloat(req.body.price),
  //         offerprice: parseFloat(req.body.offerprice),
  //         quantity: parseInt(req.body.quantity),
  //         description: req.body.description,
  //         color: req.body.color,
  //         images: imagePaths
  //       };

  //     await Product.findByIdAndUpdate(productId, updatedProduct, { new: true });

    
  //     log('updated')
  //     // res.json({ message: 'Product updated successfully' });

  //     res.redirect("/admin/product")

      
  //   } catch (error) {
  //     log('error in editing product',error);
  //     res.redirect('/admin/pageerror');
  //   }
  // }

  const editingProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const files = req.files;
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let categoryId = null;
        if (req.body.category) {
            const category = await Category.findOne({ name: req.body.category });
            if (category) {
                categoryId = category._id;
            } else {
                return res.status(400).json({ message: 'Category not found' });
            }
        }

        let updatedData = {
            name: req.body.name,
            price: req.body.price,
            offerprice: req.body.offerprice,
            description: req.body.description,
            quantity: req.body.quantity,
            color: req.body.color,
            category: categoryId
        };

        if (files && files.length >= 3) { 
            console.log('Images provided, updating images...');
            const imgPath = files.map(file => file.filename);
            updatedData.images = imgPath;  
            console.log('Updated image paths:', updatedData.images);
        } else {
            console.log('No images provided or less than 3 images, skipping image update.');
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            productId, 
            { $set: updatedData }, 
            { new: true } 
        );

        console.log('Product updated successfully:', updatedProduct);
        res.redirect('/admin/product');

    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error updating product', error });
    }
};






//============================delete the image============================

// const deleteSingleImage = async (req, res) => {
//     try {
//         const { imagePath } = req.body;

//         // Delete the image from the server
//         const fullPath = path.join(__dirname, 'uploads', imagePath);
//         if (fs.existsSync(fullPath)) {
//             fs.unlinkSync(fullPath);
//         } else {
//             return res.status(404).json({ success: false, message: 'Image not found' });
//         }

//         // Optionally, remove the image reference from the product document
//         const productId = req.query.productId; // Retrieve productId from query params or elsewhere
//         await Product.findByIdAndUpdate(productId, { $pull: { images: imagePath } });

//         res.json({ success: true });
//     } catch (error) {
//         console.error('Error deleting image:', error);
//         res.status(500).json({ success: false, message: 'Error deleting image' });
//     }
// });


// Define the base path for images
// const IMAGE_BASE_PATH = 'C:/Users/lenovo/OneDrive/Desktop/FIRST_PROJECT_WEEK 8/public/uploads';



// Function to delete a single image
const deleteSingleImage = async (req, res) => {
  const { imagePath } = req.body;

  console.log('Received imagePath:', imagePath);

  // Ensure imagePath does not have leading slashes
  // const image = '/new-images.png';

  const filePath = path.join('C:/Users/lenovo/OneDrive/Desktop/FIRST_PROJECT_WEEK 8/public', imagePath);

  console.log('Constructed filePath:', filePath);

  try {
    if (fs.existsSync(filePath)) {
      console.log('File exists. Attempting to delete.');

      fs.unlinkSync(filePath);
      
      console.log('File successfully deleted:', filePath);

      res.status(200).json({ success: true, message: 'Image deleted successfully' });
    } else {
      console.error('File not found:', filePath);

      res.status(404).json({ success: false, message: 'Image not found' });
    }
  } catch (error) {
    console.error('Error deleting image:', error);

    res.status(500).json({ success: false, message: 'Error deleting image' });
  }
};





module.exports = {
    productPage,
    addproductpage,
    productAdding,
    productBlocked,
    productUnBlock ,
    instockProduct,
    outstockProduct,
    softDeleteProduct,
    editProduct,
    editingProduct,
    deleteSingleImage,

}