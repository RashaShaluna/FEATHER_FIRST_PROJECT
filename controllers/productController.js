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
       console.log('Fetched Categories:', category);

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

const addproductpage = async(req,res)=>{
         try {
          log('in add product page')
            const category = await Category.find({islisted:true ,isDeleted:false});
            console.log('Fetched Categories:', category);
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
    console.log("Update result:", updateResult);


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
      console.log('Product:', product);
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

const editingProduct = async(req,res)=>{
  try{

  
  const productId = req.params.id;
  log('Product ID:', productId);
    let product = await Product.findById(productId);
    log(product);

  const { name, category, price, offerprice, quantity, description, color } = req.body;

  const categoryData = await Category.findOne({ name: category });
  if (!categoryData) {
    return res.status(404).json({ error: 'Category not found' });  }



    let imagePaths = product.images;

    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        if (file) {
          imagePaths[index] = `/uploads/${file.filename}`; 
        }
      });
    }


  product.name = name;
  product.category = categoryData._id;
  product.price = price;
  product.offerprice = offerprice;
  product.quantity = quantity;
  product.description = description;
  product.color = color;
  product.images = images;

  if (imagePaths.length > 0) {
    product.images = imagePaths;  // Replace old images with new ones
  }
log('imagepath ', imagePaths);
  await product.save();

  res.redirect('/admin/product');
}catch (error) {
  console.error('Error updating product:', error);
  res.status(500).json({ error: 'Internal server error' });
  }
};












//============================delete the image============================

// const deleteSingleImage = async (req, res) => {
//   try {
//     log('in deltete')
//     const { id } = req.params;
//     const { image } = req.body;

//     const product = await Product.findById(id);

//     if (!product) {
//       return res.status(404).json({ success: false, message: 'Product not found' });
//     }
//     product.images = product.images.filter(img => img !== image);

//     await product.save();

//     // Optionally, delete the image file from the uploads directory
//     const fs = require('fs');
//     const imagePath = `public/uploads/${image}`;
//     fs.unlink(imagePath, (err) => {
//       if (err) {
//         console.error('Error deleting image file:', err);
//       }
//     });

//     res.json({ success: true });
//   } catch (error) {
//     log(error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// }


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
    // deleteSingleImage

}