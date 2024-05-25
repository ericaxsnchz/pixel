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
const adminRouter = require('./server/routes/admin');


const connectDB = require('./server/config/db');

const app = express();
const PORT = 8000 || process.env.PORT;


// connect to db
connectDB();

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
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
    next();
});



// passport initialization
app.use(passport.initialize());
app.use(passport.session());

// check
// app.use('/admin', adminRouter);


passport.use(new LocalStrategy(
    async function(username, password, done) {
        try {
            const user = await User.findOne({ username });
            if (!user) {
                return done(null, false, { message: 'Incorrect username' });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);            
            if (!isPasswordValid) {
                return done(null, false, { message: 'Incorrect password' });
            }

            return done(null, user);
        } catch (error) {
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
        done(null, user);
    } catch (error) {
        done(err, null)
    }
});




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

app.get('/register', (req, res) => {
    res.render('register.ejs')
});

app.get('/login', (req, res) => {
    console.log('flash messages: ', req.flash('error'));
    res.render('login.ejs', { 
        messages: req.flash('error'),
        user: req.user 
    });
});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
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