const User = require('../models/userSchema');

const isLogin =(req, res, next) => {
  // Check if the user is logged in
  if (req.session && req.session.user) {
      return next(); // Proceed to the next middleware/controller
  } else {
      // If the user is not logged in, redirect to the login page
      return res.redirect('/login');
  }
};
//  async (req, res, next) => {
//     try {
//         if (req.session.user) {     
//     }else{
//         res.redirect('/');
//     }
//        next();
//     } catch (error) {
//         console.log('error in login auth',error);
//         res.redirect('/serverError');
//     }
// }
const logout= async (req, res, next) => {
    try {
        if (req.session.user) {     
            res.redirect('/')
        }
       next();
    } catch (error) {
        console.log('error in login auth',error);
        res.redirect('/serverError');
    }
}


const isBlocked = async (req, res, next) => {
    try {
      const userData = await User.findById(req.session.user);
      if (userData && userData.isBlocked) {
        req.session.user = null;
        res.redirect('/login');
      } else {
        next();
      }
    } catch (error) {
      console.log('Error in isBlocked middleware:', error);
      next(); // Don't redirect to login if no user exists
    }
  };

// const logout = async (req, res, next) => {
//     try {
//         req.session.destroy((err) => {
//             if (err) {
//                 console.log('Error destroying session:', err);
//                 res.redirect('/serverError');
//             } else {
//                 res.clearCookie('connect.sid');
//                 res.redirect('/');
//             }
//         });
//     } catch (error) {
//         console.log('Error logging out:', error);
//         res.redirect('/serverError');
//     }
// };





module.exports = {
    isLogin,
    isBlocked,
    logout

}