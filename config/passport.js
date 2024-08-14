const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require("../models/userSchema");
const env = require('dotenv').config();
const FacebookStrategy = require('passport-facebook').Strategy;


//=================== gogole atuh ===================================================================================
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

// =====================================================================================================================

module.exports = passport;
  

