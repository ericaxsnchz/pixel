require('dotenv').config();

const express = require('express');
const expressLayout = require('express-ejs-layouts')
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');
const expressSession = require('express-session');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const connectDB = require('./server/config/db');

const app = express();
const PORT = 8000 || process.env.PORT;


// connect to db
connectDB();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(expressSession({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI
    }),
}))
app.use(express.static('public'));

// template engine
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

app.use('/', require('./server/routes/main'));
app.use('/', require('./server/routes/admin'));

// login - register - home (new)

app.get('/', async (req, res) => {
    res.render('index.ejs')
});

app.get('/login', async (req, res) => {
    res.render('login.ejs');
});

app.post('/login', (req, res) => {

})

app.get('/register', async (req, res) => {
    res.render('register.ejs')
});


app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});