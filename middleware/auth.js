const User = require('../models/userSchema');
const Category = require('../models/category');
const Product = require('../models/productModel')

const userAuth = (req, res, next) => {
    if (req.session.user) {
        User.findById(req.session.user)
            .then(data => {
                if (data && !data.isBlocked) {
                    next();
                } else {
                    res.redirect('/');
                }
            })
            .catch(error => {
                console.log('Error in user auth middleware', error);
                res.status(500).send('Internal Server Error');
            });
    } else {
        res.redirect('/');
    }
};

const adminAuth = (req, res, next) => {
    User.findOne({ isAdmin: true })
        .then(data => {
            if (data) {
                next();
            } else {
                res.redirect('/admin/login'); 
            }
        })
        .catch(error => {
            console.log('Error in admin auth middleware', error);
            res.status(500).send('Internal Server Error');
        });
}; 
// const adminAuth = async (req, res, next) => {
//     try {
//         if ( req.session.admin) {
//             next(); 
//         } else {
//             res.redirect("/admin/log"); 
//         }
//     } catch (error) {
//         console.log(error.message);
//         res.status(500).send("Internal Server Error");
//     }
// };


// const userAuth = async (req, res, next) => {
//     if (req.session.user) {
//         try {
//             const user = await User.findById(req.session.user);
            
//             if (user) {
//                 if (!user.isBlocked) {
//                     next();
//                 } else {
//                     req.session.destroy(); // Destroy the session

//                     // Fetch categories and products asynchronously
//                     const categories = await Category.find({ islisted: true, isDeleted: false });
//                     const products = await Product.find({ isBlocked: false, isDeleted: false }).limit(4);

//                     return res.render('users/login', {
//                         title: 'Feather - loginpage',
//                         message: 'You have been blocked by the admin.',
//                         categories,
//                         products
//                     });
//                 }
//             } else {
//                 res.redirect('/');
//             }
//         } catch (error) {
//             console.log('Error in user auth middleware', error);
//             res.status(500).send('Internal Server Error');
//         }
//     } else {
//         res.redirect('/');
//     }
// };

// const adminAuth = async (req, res, next) => {
//     try {
//         // Assuming you have user information in session or token
//         if (req.session.user && req.session.user.isAdmin) {
//             // User is authenticated and is an admin
//             next();
//         } else {
//             res.redirect('/admin/log'); 
//         }
//     } catch (error) {
//         console.log('Error in admin auth middleware', error);
//         res.status(500).send('Internal Server Error');
//     }
// };

module.exports = {
    userAuth,
    adminAuth
};
