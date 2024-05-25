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

module.exports = router;



