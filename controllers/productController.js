const Product = require('../models/productModel');
const Category = require('../models/category');
const User = require('../models/userSchema');
const fs = require('fs');
const path = require('path');
const {log} = require('console');
const multer = require('multer');
const mongoose = require('mongoose')

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

  const editingProduct = async(req,res)=>{
    try {
      log('product editing')
      const productId = req.params.id;
      log('product id',productId);

      const product = await Product.findOne({_id:productId});
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
        const data = req.body;
        log('data',data)
        const existingProduct = await Product.findOne({
          name:data.name,
          _id:{$ne:productId}
        })
        log('1')
        if(existingProduct){
          return res.status(400).json({messge:'Product with this name already exists . Try with another name'});
        }
        const images =[];

        if( req.files && req.files.length>0){
          for(let i=0;i<req.files.length;i++){
            images.push(req.files[i].filename);
          }
        }
  log('2')
        const category = await Category.findOne({ name: data.category });
        if (!category) {
          return res.status(400).json({ message: 'Invalid category name' });
        }

      const updateFields ={
            name:data.name,
            description:data.description,
            category: category._id,
            quantity:data.quantity,
            price:data.price,
            offerPrice:data.offerprice,
            color:data.color
      }
      // if(req.files.length>0){
      //   updateFields.$push= {productImage:{$search:images}};
      // }

      if(req.files.length > 0){
        updateFields.productImage = { $push: { $each: images } };
    }
    
      await Product.findByIdAndUpdate(productId,updateFields,{new:true});
      log('updated')
      res.redirect("/admin/product");

      
    } catch (error) {
      log('error in editing product',error);
      res.redirect('/admin/pageerror');
    }
  }



//============================delete the image============================
const deleteSingleImage = async (req, res) => {
  log('in delete')
  const imageName = req.params.imageName;
  log('image name',imageName)
  const imagePath = path.join(process.env.IMAGE_BASE_PATH, imageName);
  log('Resolved image path:', imagePath);

  try {
    log('hited the try')
    if (fs.existsSync(imagePath)) {
      log('File exists, proceeding to delete.');
      fs.unlinkSync(imagePath);
      log('unsynck')
          const result = await Product.updateOne(
              { 'images': imageName },
              { $pull: { 'images': imageName } }
          );
          
        

          if (result.nModified >0) {
            res.json({ success: true, message: 'Image deleted from database.' });
        } else {
            res.json({ success: false, message: 'Image not found in database.' });
        }
        
      } else {
          res.json({ success: false, message: 'Image file not found.' });
      }
  } catch (error) {
    log('error in deleting images',error)
      res.json({ success: false, message: 'Error deleting image.' });
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
    deleteSingleImage

}