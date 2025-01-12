const Category = require('../models/category');

// =========================================================== Category ========================================================================================
const categoryInfo = async(req,res)=>{
      try {

       let search='';
       if(req.query.search){
         search =req.query.search;
       }


       const categories = await Category.find({
        name: { $regex: search, $options: 'i' },
        isDeleted: false 
        }).sort({ name: -1 });

        res.render('admin/category', { categories ,
          title:"Category - Feather",
           searchQuery:search   
        });
      } catch (error) {
    console.log(error);
   res.redirect('/pageerror');
  }
}

// ========================================================== Add Category page ==========================================================================================
const addCategoryPage = async(req,res)=>{
    const categoryId = req.params.id;
    const categories = await Category.findById(categoryId);
    try {
        console.log('in add')

        res.render('admin/addCategory',{title:'Add Category',categories});
      } catch (error) {
        console.log(error);
    
      }
    }
  
// ======================================================= Add category ======================================================================================================
const addCategory = async(req,res)=>{
    console.log('in add cat1')

    const {name,description,offerPercentage} =req.body;
    try {
      const lowerCaseName = name.toLowerCase();

        console.log('in add cat 2')

        if (!name || !description) {
            return res.status(400).json({ success: false, message: 'Name and Description are required!' });
        }

        console.log('in add cat 3')
        const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${lowerCaseName}$`, 'i') } });
        console.log('in add cat 4');
        if(existingCategory){
            return res.status(400).json({message:'Category already exists'});
        }
        console.log('in add cat 5')

    
            const newCategory = new Category({
            name,
            description,
            offerPercentage
        })

     const result =    await newCategory.save();


        console.log('saved');
        res.status(201).json({ success: true, message: 'Category added successfully!' });
    } catch (error) {
        console.log('error in adding',error);
        res.status(500).json({ success: false, message: 'Server Error. Please try again later.' });
        
    }
}

//============================================= Category List===================================================================================================

const listCategory =async(req,res)=>{
  try {
    console.log('list')
    let id = req.query.id;
    await Category.updateOne({_id:id},{$set:{islisted:true}});
    console.log('listed')

    res.redirect('/admin/category');
  } catch (error) {
    console.log(error)
     res.redirect('/pageerror');
  }
}
//============================================= Category unlist=====================================================================================================

const unListCategory = async(req,res) =>{
  try{
    console.log('unlist')

   let id = req.query.id;
   await Category.updateOne({_id:id},{$set:{islisted:false}});
   console.log('unlisted')

   res.redirect('/admin/category');
  }catch(error){
    console.log(error)
    res.redirect('/pageerror');
  }
}

// ====================================== Edit Category  ========================================================================================================================
  const editCategory = async (req, res) => {
    try {
      const { categoryId, editedDescription, editedName, editedOfferPercentage } = req.body;
  
      const lowerCaseEditedName = editedName.toLowerCase();
  
      const existingCategory = await Category.findOne({ 
        _id: { $ne: categoryId }, 
        name: { $regex: new RegExp(`^${lowerCaseEditedName}$`, 'i') } 
      });
  
      if (existingCategory) {
        return res.status(400).json({ success: false, message: 'Another category with this name already exists' });
      }
  
      await Category.updateOne(
        { _id: categoryId },
        { $set: { name: editedName, description: editedDescription, offerPercentage: editedOfferPercentage } }
      );
  
      res.json({ success: true, message: 'Category updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
  
// ====================================== Check Category  ========================================================================================================================

const checkCategory = async (req, res) => {
  try {
    const { editedName, categoryId } = req.body;

    const lowerCaseEditedName = editedName.toLowerCase();

    const existingCategory = await Category.findOne({ 
      _id: { $ne: categoryId },
      name: { $regex: new RegExp(`^${lowerCaseEditedName}$`, 'i') } 
    });

    if (existingCategory) {
      return res.json({ available: false });
    } else {
      return res.json({ available: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// =================================================== Soft Delete Category ========================================================================================
const softDeleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    // Validate categoryId
    if (!categoryId || categoryId === 'null') {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }

    

    console.log("Delete category with ID:", categoryId);

    const updateResult = await Category.updateOne(
      { _id: categoryId },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    console.log("Update result:", updateResult);

    if (updateResult.modifiedCount > 0) {
      res.json({ success: true, message: 'Category deleted successfully' });
    } else {
      res.json({ success: false, message: 'Category not found or already deleted' });
    }
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};





module.exports={
    categoryInfo,
    addCategory,
    addCategoryPage,
    listCategory,
    unListCategory,
    editCategory,
    checkCategory,
    softDeleteCategory,
   
}