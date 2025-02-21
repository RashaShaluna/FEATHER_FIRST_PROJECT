const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require("../models/userSchema");
const env = require('dotenv').config();
const FacebookStrategy = require('passport-facebook').Strategy;


//============================================ gogole ============================================================================

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:4000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({
          $or: [{ googleId: profile.id }, { email: profile.emails[0].value }],
        });

        if (user) {
          if (!user.googleId) {
            user.googleId = profile.id; // Update if Google ID isn't set
            await user.save();
          }
          return done(null, user); // User exists
        }

        // If user doesn't exist, create a new one
        user = new User({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
        });
        await user.save();
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => done(null, user))
    .catch((err) => done(err, null));
});

// ======================================== facebook =======================================================================

passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: 'http://localhost:4000/auth/facebook/callback',
        // profileFields: ['id', 'displayName'], 
      },
      async (accessToken, refreshToken, profile, cb) => {
        try {
          let user = await User.findOne({
            facebookId: profile.id,
          });
  
          if (!user) {
            console.log('adding new Facebook user to DB');
            user = new User({
              name: profile.displayName,
              facebookId: profile.id,
            email: profile.emails ? profile.emails[0].value : null, 
              provider: 'facebook',
            });
            await user.save();
            return cb(null, user);
          } else {
            console.log('facebook user exists');
            return cb(null, user);
          }
        } catch (error) {
          console.error('facebook OAuth Error:', error);
          return cb(error, null);
        }
      }
    )
  );
  
  // serialization
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // deserialization
  passport.deserializeUser((id, done) => {
    User.findById(id)
      .then((user) => {
        done(null, user);
      })
      .catch((err) => {
        done(err, null);
      });
  });

//   =================================================================================================================

module.exports = passport;
  

