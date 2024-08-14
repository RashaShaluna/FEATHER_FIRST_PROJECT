const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require("../models/userSchema");
const env = require('dotenv').config();
const FacebookStrategy = require('passport-facebook').Strategy;


//============================================ gogole ============================================================================
passport.use(new GoogleStrategy({
    clientID : process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:'http://localhost:4000/auth/google/callback'
},
//   to fetch details of user


async(accessToken,refreshToken,profile,done)=>{
    console.log(profile)

    try {
        let user = await User.findOne({googleId:profile.id});
        if(user){
            return done(null,user);

        }else{
            user = new User({
                name:profile.displayName,
                email:profile.emails[0].value,
                googleId:profile.id
            });
            await user.save();
            return done(null,user);
        }
    } catch (error) {
        console.error('Google OAuth Error:', error);
          return done(error,null)
    }
}


));

// to assign  user to session  - serialization

passport.serializeUser((user,done)=>{
    done(null,user.id);
})

// user details used fetch - deseriazile

passport.deserializeUser((id,done)=>{
    User.findById(id)
    .then(user =>{
        done(null,user)
    })
    .catch(err =>{
        done(err,null)
    })
})

// ======================================== facebook =======================================================================

// passport.use(
//     new FacebookStrategy(
//       {
//         clientID: process.env.FACEBOOK_CLIENT_ID,
//         clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
//         callbackURL: process.env.FACEBOOK_CALLBACK_URL,
//       },
//       async function (accessToken, refreshToken, profile, cb) {
//         const user = await User.findOne({
//           accountId: profile.id,
//           provider: 'facebook',
//         });
//         if (!user) {
//           console.log('adding new facebook user to DB');
//           const user = new User({
//             accountId: profile.id,
//             name: profile.displayName,
//             provider: profile.provider,
//           });
//           await user.save();
//           // console.log(user);
//           return cb(null, profile);
//         } else {
//             res.redirect('/users/login')
//           console.log('facebook user exist');
//           // console.log(profile);
//           return cb(null, profile);
//         }
//       }
//     )
//   );


passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: 'http://localhost:4000/auth/facebook/callback',
        profileFields: ['id', 'displayName'], // Request email in case it's available
      },
      async (accessToken, refreshToken, profile, cb) => {
        try {
          let user = await User.findOne({
            facebookId: profile.id,
          });
  
          if (!user) {
            console.log('Adding new Facebook user to DB');
            user = new User({
              name: profile.displayName,
              facebookId: profile.id,
            email: profile.emails ? profile.emails[0].value : null, 
              provider: 'facebook',
            });
            await user.save();
            return cb(null, user);
          } else {
            console.log('Facebook user exists');
            return cb(null, user);
          }
        } catch (error) {
          console.error('Facebook OAuth Error:', error);
          return cb(error, null);
        }
      }
    )
  );
  
  // Serialization
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // Deserialization
  passport.deserializeUser((id, done) => {
    User.findById(id)
      .then((user) => {
        done(null, user);
      })
      .catch((err) => {
        done(err, null);
      });
  });


module.exports = passport;
  

