require('dotenv').config();

const express = require('express');
const expressLayout = require('express-ejs-layouts')
const cors = require('cors');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');
const expressSession = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./server/models/User');


const connectDB = require('./server/config/db');

const app = express();
const PORT = 8000 || process.env.PORT;


// connect to db
connectDB();

// middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(expressSession({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI
    }),
}));
app.use(flash());
app.use(express.static('public'));

app.use((req, res, next) => {
    console.log('Session:', req.session);
    console.log('User:', req.user);
    next();
});


// passport initialization
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
    async function(username, password, done) {
        try {
            const user = await User.findOne({ username: username });
            console.log('user found: ', user);
            if (!user) {
                return done(null, false, { message: 'incorrect username' })
            }
            const isPasswordValid = await user.verifyPassword(password);
            console.log(`password valid: ${isPasswordValid}`);
            if (!isPasswordValid) {
                console.log('incorrect password')
                return done(null, false, { message: 'incorrect password' })
            }
            return done(null, user);
        } catch (error) {
            console.error('error in local strategy', error);
            return done(error);
        }
    }
));

// serialize and deserialize user
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        console.log('deserialized user: ', user)
        done(null, user);
    } catch (error) {
        console.log('error in deserialization:', error)
        done(err, null)
    }
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/admin/dashboard',
    failureRedirect: '/login',
    failureFlash: true 
}));


// template engine
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

app.use('/', require('./server/routes/main'));
app.use('/admin', require('./server/routes/admin'));

// Protected route example
app.get('/admin', (req, res) => {
    res.render('admin/dashboard', { user: req.user });
});

// login - register - home (new)

app.get('/', async (req, res) => {
    res.render('index.ejs')
});

app.get('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const newUser = new User({ username, password });
        await newUser.save();
        res.redirect('/login');
    } catch (error) {
        console.log('Registration error:', error);
    res.render('register.ejs')
}});

app.get('/login', (req, res) => {
    console.log('flash messages: ', req.flash('error'));
    res.render('login.ejs', { 
        messages: req.flash('error'),
        user: req.user 
    });
});

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) { return next(err) }
        res.clearCookie('token');
        res.redirect('/login')
    });
});

app.get('/admin/dashboard', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('admin/dashboard', { user: req.user });
    } else {
        res.redirect('/login');
    }
});


app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});