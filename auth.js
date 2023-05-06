import express from "express";
import session from "express-session";
import mongoose from "mongoose";
const Schema = mongoose.Schema;

import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import GoogleStrategy from "passport-google-oauth20";

import * as dotenv from 'dotenv';
dotenv.config();

// middlewares
const authRouter = express.Router();
authRouter.use(session({
    secret: 'screte made by kebing',
    resave: false,
    saveUninitialized: false,
}));
authRouter.use(passport.authenticate('session'));

// mongoose schema
mongoose.connect(process.env.uri);
const userSchema = new Schema({
    email: {
        type: String,
        unique: true,
    },
    // TODO: add pattern requirements for password
    password: {
        type: String
    },
    role: {
        type: String,
        default: "Basic",
        required: true,
    },
});

userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userSchema);
// register the strategy
passport.use(User.createStrategy());
passport.use(new GoogleStrategy({
    clientID: process.env.clientID,
    clientSecret: process.env.clientSecret,
    callbackURL: "http://localhost:3000/auth/home"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

authRouter.get('/home', function (req, res, next) {
    if (req.isAuthenticated()) {
        res.send('Enter Home Page');
    } else {
        res.redirect("/login");
    }

});

/* const user = new User({
    username: req.body.username,
    password: req.body.password
}); */

authRouter.route('/signup').get(function (req, res, next) {
    res.render('signup');
}).post(function (req, res, next) {
    User.register({ username: req.body.username }, req.body.password).then((user) => {
        passport.authenticate("local")(req, res, function () {
            res.redirect("/home");
        });
    }).catch((err) => {
        console.log(err);
        res.redirect("/signup");
    });
});

authRouter.route('/login').get(function (req, res, next) {
    res.render('login');
}).post(passport.authenticate('local', { failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/home');
    }
);

authRouter.post('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/login');
    });
});

// OAUTH for google
authRouter.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

authRouter.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
});

export default authRouter;