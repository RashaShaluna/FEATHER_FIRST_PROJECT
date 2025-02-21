const Product = require("../models/productModel");
const Category = require("../models/category");
const User = require("../models/userSchema");
const fs = require("fs");
const path = require("path");
const { log } = require("console");
const multer = require("multer");
const mongoose = require("mongoose");
const env = require("dotenv").config();

const messages = {
  INVALID_OFFER_PRICE: "Offer percentage must be between 0 and 100",
  PRODUCT_EXIST: "Product already exists",
  PRODUCT_ADDED: "Product added successfully",
  PRODUCT_DELETED: "Product deleted successfully",
  PRODUCT_NOTFOUND: "Product not found or already deleted",
  PRODUCT_UPDATED: "Product updated successfully",
  IMAGES_DELETED: "Image deleted successfully",
};
// =========================================== Product page ===================================================================
const productPage = async (req, res) => {
  try {
    let search = "";
    let page = req.query.page ||1;
    let limit = 10 ;
    let skip = (page-1)*limit

    if (req.query.search) {
      search = req.query.search;
    }

    const [category, product,totalProducts] = await Promise.all([
      await Category.find({ islisted: true, isDeleted: false }),
      Product.find({
        isDeleted: false,
        $or: [
          { name: { $regex: search, $options: "i" } },
          { color: { $regex: search, $options: "i" } },
        ],
      })
        .populate("category")
        .sort({ name: -1 })
        .skip(skip)
        .limit(limit),
        Product.countDocuments()

    ]);

    if (category) {
      res.render("admin/product", {
        title: "Product - Feather",
        searchQuery: search,
        data: product,
        currentPage: page,
        totalPage: Math.ceil(totalProducts / limit),
        totalProducts
      });
    } else {
      res.redirect("/admin/pageerror");
    }
  } catch (error) {
    console.log("error", error);
    res.redirect("/admin/pageerror");
  }
};

// ================================================================= Add product  page =================================================

const addproductpage = async (req, res) => {
  try {
    const category = await Category.find({ islisted: true, isDeleted: false });
    res.render("admin/addProduct", {
      category,
      title: "Add Product - Feather",
    });
  } catch (error) {
    console.log(error);
    res.redirect("/admin/pageerror");
  }
};

// ================================================== Adding product ==============================================================================

const productAdding = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      salesPrice,
      category,
      quantity,
      offerPercentage,
      color,
      offerStartDate,
      offerEndDate,
    } = req.body;
    const images = req.files.map((file) => `${file.filename}`);

    const existingProduct = await Product.findOne({
      name: { $regex: `${name}`, $options: "i" },
      category,
    });
    if (isNaN(offerPercentage) || offerPercentage < 0 || offerPercentage >= 100) {
      return res.json({
        success: false,
        message: messages.INVALID_OFFER_PRICE,
      });
    }

    if (existingProduct) {
      return res
        .status(400)
        .json({ success: false, message: messages.PRODUCT_EXIST });
    }
   

    const newProduct = new Product({
      name: capitalizeFirstLetter(name),
      price,
      description: capitalizeFirstLetter(description),
      category: capitalizeFirstLetter(category),
      quantity,
      price,
      salesPrice,
      offerPercentage: offerPercentage || null,
      OfferStartDate: offerStartDate || null,
      OfferEndDate: offerEndDate || null,
      color: capitalizeFirstLetter(color),
      images,
    });
    //capitalizing the first letter
    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

    const productData = await newProduct.save();

    res.json({ success: true, message: messages.PRODUCT_ADDED });
  } catch (error) {
    log("Error:", error);
    res.redirect("/admin/pageerror");
  }
};

// ===================================== Stock ===============================================

const instockProduct = async (req, res) => {
  try {
    let id = req.query.id;
    await Product.updateOne({ _id: id }, { $set: { status: "In stock" } });
    res.redirect("/admin/product");
  } catch (error) {
    console.log(error);
    res.redirect("/admin/pageerror");
  }
};

// =====================================Out Stock ===============================================

const outstockProduct = async (req, res) => {
  try {
    let id = req.query.id;
    await Product.updateOne({ _id: id }, { $set: { status: "Out of stock" } });
    res.redirect("/admin/product");
  } catch (error) {
    console.log(error);
    res.redirect("/admin/pageerror");
  }
};

//================================ Block user ==========================
const productBlocked = async (req, res) => {
  try {
    let id = req.query.id;
    await Product.updateOne({ _id: id }, { $set: { isBlocked: true } });
    res.redirect("/admin/product");
  } catch (error) {
    console.error("Error blocking Product:", error);
    res.redirect("/admin/pageerror");
  }
};

// =============================unblock Product =====================================================================
const productUnBlock = async (req, res) => {
  try {
    let id = req.query.id;
    await Product.updateOne({ _id: id }, { $set: { isBlocked: false } });
    res.redirect("/admin/product");
  } catch (error) {
    console.error("Error blocking Product:", error);

    res.redirect("/admin/pageerror");
  }
};

// ============================= Delete Product =====================================================================

const softDeleteProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    const updateResult = await Product.updateOne(
      { _id: productId },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    if (updateResult.modifiedCount > 0) {
      res.json({ success: true, message: messages.PRODUCT_DELETED });
    } else {
      res.json({
        success: false,
        message: messages.PRODUCT_NOTFOUND,
      });
    }
  } catch (error) {
    console.error("Error deleting product", error);
    res.redirect("/admin/pageerror");
  }
};

// =========================================== edit product page ===============================================

const editProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const isValidObjectId = mongoose.Types.ObjectId.isValid(productId);
    if (!isValidObjectId) {
      console.error("Invalid Product ID format");
      res.redirect("/admin/pageerror");
    }

    const product = await Product.findById(productId);
    const categories = await Category.find({
      islisted: true,
      isDeleted: false,
    });

    res.render("admin/editProduct", {
      title: "Edit product",
      product,
      category: categories,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/admin/pageerror");
  }
};

// =========================================== edit product ===============================================

const editingProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const files = req.files;
    const product = await Product.findById(productId);

    let categoryId = null;
    if (req.body.categoryId) {
      const category = await Category.findById(req.body.categoryId);
      if (category) {
        categoryId = category._id;
      } else {
        res.redirect("/serverError");
      }
    }

    product.name = req.body.name;
    product.salesPrice = req.body.salesPrice;
    product.offerPercentage = req.body.offerPercentage;
    product.offerStartDate = req.body.offerStartDate;
    product.offerEndDate = req.body.offerEndDate;
    product.description = req.body.description;
    product.quantity = req.body.quantity;
    product.color = req.body.color;
    product.category = categoryId;

    const images = [
      files["image1"] ? files["image1"][0].filename : product.images[0] || null,
      files["image2"] ? files["image2"][0].filename : product.images[1] || null,
      files["image3"] ? files["image3"][0].filename : product.images[2] || null,
    ];

    product.images = images.filter((image) => image !== null);

    const result = await product.save();

    return res.json({
      success: true,
      message: messages.PRODUCT_UPDATED,
      product: result,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.redirect("/serverError");
  }
};

//============================delete the image============================const fs = require('fs');

const deleteSingleImage = async (req, res) => {
  const { imagePath, productId } = req.body;

  const filePath = path.join(
    "C:/Users/lenovo/OneDrive/Desktop/FIRST_PROJECT_WEEK 8/public",
    imagePath
  );

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);

      const product = await Product.findByIdAndUpdate(
        productId,
        { $pull: { images: imagePath } },
        { new: true }
      );
      if (!product) {
        return res.json({ success: false, message: messages.PRODUCT_NOTFOUND });
      }

      res.json({ success: true, message: messages.IMAGES_DELETED });
    } else {
      console.error("File not found:", filePath);

      res.redirect("/serverError");
    }
  } catch (error) {
    console.error("Error deleting image:", error);
    res.redirect("/serverError");
  }
};

module.exports = {
  productPage,
  addproductpage,
  productAdding,
  productBlocked,
  productUnBlock,
  instockProduct,
  outstockProduct,
  softDeleteProduct,
  editProduct,
  editingProduct,
  deleteSingleImage,
};
