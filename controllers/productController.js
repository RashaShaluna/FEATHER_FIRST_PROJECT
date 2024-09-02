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
       console.log('Fetched Categories:', category);

       const product = await Product.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          // { category: { $regex: search, $options: 'i' } },
          { color: { $regex: search, $options: 'i' } }
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
    const images = req.files.map(file => `uploads/${file.filename}`); 
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
    log('in delete')
    const productId = req.params.productId;
    log('Deleting product id:', productId);

    const updateResult = await Product.updateOne(
      { _id: productId },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    console.log('Update Result:', updateResult);

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
    const productId = req.params.id;
    const product = await Product.findOne(productId);

    const categories = await Category.find();
    console.log('Product:', product);
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
     const product = await Product.findOne({_id:productId});
      const data = req.body;
      const existingProduct = await Product.findOnd({
        name:data.name,
        _id:{$ne:productId}
      })
      
      if(existingProduct){
        return res.status(400).json({messge:'Product with this name already exists . Try with another name'});
      }
      const images =[];

      if( req.files && req.files.length>0){
        for(let i=0;i<req.files.length;i++){
          images.push(req.files[i].filename);
        }
      }

    const updateFields ={
           name:data.name,
           description:data.description,
           category:data.category,
           quantity:data.quantity,
           price:data.price,
           offerPrice:data.price,
           color:data.color
    }
    if(req.files.length>0){
      updateFields.$push= {productImage:{$search:images}};
    }

    await Product.findByIdAndUpdate(productId,updateFields,{new:true});
    res.redirect("/admin/editProduct");

    
  } catch (error) {
     log('error in editing product',error);
     res.redirect('/admin/pageerror');
  }
}

// const editingProduct= async (req, res) => {
//   try {
//     const productId = req.params.id;
//     const product = await Product.findById(productId);

//     if (!product) {
//       return res.status(404).json({ message: 'Product not found' });
//     }

//     const updates = {
//       name: req.body.name,
//       category: req.body.category,
//       price: parseFloat(req.body.price),
//       offerprice: parseFloat(req.body.offerprice),
//       quantity: parseInt(req.body.quantity),
//       description: req.body.description,
//       color: req.body.color
//     };

//     // Handle image uploads
//     if (req.files && req.files.images) {
//       const imagePaths = req.files.images.map(file => file.path.replace('public/', ''));
//       updates.productImage = imagePaths;

//       // Optional: delete old images from server
//       product.productImage.forEach(image => {
//         const oldImagePath = path.join('public', image);
//         if (fs.existsSync(oldImagePath)) {
//           fs.unlinkSync(oldImagePath);
//         }
//       });
//     }

//     await Product.findByIdAndUpdate(productId, updates);
//     res.json({ message: 'Product updated successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// };


const deleteSingleImage  = async(req,res)=>{
   
  try {
    
   const {imageNameToServer,productIdServer} = req.body;
   const product = await Product.findByIdAndUpdate(productIdServer,{$pusll:{productImage:imageNameToServer}});
   const imagePath = path .join('public','uploads','re-image',imageNameToServer);
   if(fs.existsSync(imagePath)){
    await fs.unlinkSync(imagePath);
    log('Image deleted',imageNameToServer);
   }else{
    log('Image not found',imageNameToServer);
   }
  } catch (error) {
   log(error)
   res.redirect('/admin/pagerror');
  }
}





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