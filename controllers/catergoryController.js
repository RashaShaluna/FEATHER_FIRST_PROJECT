const Category = require('../models/category');

// ============================================= Category ==============================
const categoryInfo = async(req,res)=>{
      try {

       let search='';
       if(req.query.search){
         search =req.query.search;
       }


       const categories = await Category.find({
        name: { $regex: search, $options: 'i' } 
        }).sort({ name: -1 });

        console.log("categories : ", categories);
        res.render('admin/category', { categories ,
          title:"Category - Feather",
           searchQuery:search   
        });
      } catch (error) {
    console.log(error);
   res.redirect('/pageerror');
  }
}
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit =1;
//         const skip = (page -1)*limit;

//         const categoryData = await Category.find({})
//         .sort({createdAt :-1})
//         .skip(skip)
//         .limit(limit);

//         const totalCategories = await Category.countDocuments();
//         const totalPages = Math.ceil(totalCategories/limit);
//         res.render('admin/category',{
//             title:'Category',
//             cat:categoryData,
//             currentPage:page,
//             totalPages:totalPages,
//             totalCategories : totalCategories
//         })
//     } catch (error) {
//         console.error(error);
//         res.redirect('/pageerror');
//     }
// }

// ================================= Add Category page ====================================
const addCategoryPage = async(req,res)=>{
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);
    try {
        console.log('in add')

        res.render('admin/addCategory',{title:'Add Category'});
      } catch (error) {
        console.log(error);
    
      }
    }
  
// ================================== Add category ======================================
const addCategory = async(req,res)=>{
    console.log('in add cat1')

    const {name,description} =req.body;
    console.log('req',req.body);
    try {
        console.log('in add cat 2')

        if (!name || !description) {
            return res.status(400).json({ success: false, message: 'Name and Description are required!' });
        }

        console.log('in add cat 3')
        const existingCategory = await Category.findOne({name});
        console.log('in add cat 4');
        if(existingCategory){
            return res.status(400).json({error:'Category already exists'});
        }
        console.log('in add cat 5')
        const newCategory = new Category({
            name,
            description
        })
        console.log('new cat',newCategory);

        await newCategory.save();

        console.log('in add cat 5')

        console.log('saved');
        res.status(201).json({ success: true, message: 'Category added successfully!' });
    } catch (error) {
        console.log('error in adding',error);
        res.status(500).json({ success: false, message: 'Server Error. Please try again later.' });
        
    }
}

//============================================= Category List===============================

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
//============================================= Category unlist===============================

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




module.exports={
    categoryInfo,
    addCategory,
    addCategoryPage,
    listCategory,
    unListCategory
}