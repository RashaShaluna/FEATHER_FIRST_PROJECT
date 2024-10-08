
const User = require('../models/userSchema');

//================================= user details showing=====================================
const customerInfo = async (req, res) => {
    try {
        let search = '';
        if (req.query.search) {
            search = req.query.search;
        }

        let page = 1;
        if (req.query.page) {
            page = req.query.page;
        }

        // for pagination
        const limit = 5
        const userData = await User.find({
            isAdmin: false,
            $or: [
                {name:{$regex:'.*'+ search+'.*'}}, 
                {email:{$regex:'.*'+ search+'.*'}},
            ]
        })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

        const count = await User.find({
            isAdmin: false,
            $or: [
                {name:{$regex:'.*'+ search+'.*'}},
                {email:{$regex:'.*'+ search+'.*'}},
            ]
        })
        .countDocuments();

        res.render('admin/customers', {
            title: "Customer - Feather",
            data: userData, 
            currentPage: page, 
            totalPage: Math.ceil(count / limit), 
            searchQuery: search 
        });
    } catch (error) {
        console.log('Error in customerInfo:', error);
        res.redirect('/pageerror');
    }
};

//================================ Block user ==========================
const customerBlocked = async(req,res)=>{
    try {
        let id = req.query.id;
        await User.updateOne({_id:id},{$set:{isBlocked:true}});
        res.redirect('/admin/users');
    } catch (error) {
        console.error('Error blocking user:', error);
        res.redirect('/admin/pageerror')
    }
}

// =============================unblock user =====================================================================
const customerUnBlock =async(req,res)=>{
    try {
      let id = req.query.id;
      await User.updateOne({_id:id},{$set:{isBlocked :false}});
      res.redirect('/admin/users');
    }catch(error){
        console.error('Error blocking user:', error);

     res.redirect('/admin/pageerror');
    }
}
















module.exports = {
    customerInfo,
    customerBlocked,
    customerUnBlock
}
