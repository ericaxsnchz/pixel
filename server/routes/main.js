const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

//routes
router.get('', async (req, res) => {
    const locals = {
        title: "pixel",
        description: "add to the discusssion"
    }
    try {
        const data = await Post.find();
        res.render('index', { locals, data });
    } catch (error) {
        console.log(error);
    }
});

router.get('/post/:id', async (req, res) => {
    try {
        const locals = {
            title: "pixel",
            description: "add to the discusssion"
        }

        let slug = req.params.id;

        const data = await Post.findById({ _id: slug });
        res.render('post', { locals, data });
    } catch (error) {
        console.log(error);
    }
});

router.get('/about', (req, res) => {
    res.render('about');
});

module.exports = router;



