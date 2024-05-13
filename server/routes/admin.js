const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');

const adminLayout = '../views/layouts/admin';

// admin - login page
router.get('/admin', async (req, res) => {
    try {
        const locals = {
            title: "admin",
            description: "add to the discusssion"
        }

        res.render('admin/login', { locals, layout: adminLayout });
    } catch (error) {
        console.log(error);
    }
});

// admin - check login
router.post('/admin', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(req.body);
        res.redirect('/admin');
    } catch (error) {
        console.log(error);
    }
});



module.exports = router;