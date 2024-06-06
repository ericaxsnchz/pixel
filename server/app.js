const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('PORT:', process.env.PORT);

const express = require('express');
const expressLayout = require('express-ejs-layouts');
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
const User = require('./models/User');
const connectDB = require('./config/db');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('views', path.join(__dirname, '../views'));

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
app.use(express.static(path.join(__dirname, '../public')));

app.use((req, res, next) => {
    res.setTimeout(30000, () => {
      console.log('Request has timed out.');
      res.status(500).send('Request Timeout');
    });
    next();
});

// passport initialization
app.use(passport.initialize());
app.use(passport.session());

// passport strategy
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
        done(error, null);
    }
});

// template engine
app.use(expressLayout);
app.set('layout', '../views/layouts/main');
app.set('view engine', 'ejs');

app.use('/', require('./routes/main'));
app.use('/admin', require('./routes/admin'));

app.get('/admin', (req, res) => {
    res.render('admin/dashboard', { user: req.user });
});

// login - register - home (new)
app.get('/', async (req, res) => {
    res.render('index.ejs');
});

app.get('/register', (req, res) => {
    res.render('register.ejs');
});

app.get('/login', (req, res) => {
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
    console.log(`Server is running on port ${PORT}`);
});
