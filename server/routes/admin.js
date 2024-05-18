const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Channel = require('../models/Channel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const adminLayout = '../views/layouts/admin';
const jwtSecret = process.env.JWT_SECRET;

// authorize
const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    
    if(!token) {
        return res.status(401).json({ message: 'unauthorized' });
    } 

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'unauthorized' });
    }
}

// register
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User ({
            username,
            password: hashedPassword
        });
        await newUser.save();
        res.redirect('/login')
    } catch (error) {
        console.log(error);
        res.redirect('/register')
    }
});

// login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne( {username} );

        if(!user) {
            return res.status(401).json( {message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid) {
            return res.status(401).json( {message: 'Invalid credentials' });
        }
        
        const token = jwt.sign( {userId: user._id}, jwtSecret )
        res.cookie('token', token, { httpOnly: true })

        res.redirect('/dashboard');

    } catch (error) {
        console.log(error);
    }
});

// logout
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});





// dashboard 
router.get('/dashboard', async (req, res) => {
    try {
        const locals = {
            title: "pixel",
            description: "add to the discusssion"
        }
        const data = await Post.find();
        res.render('admin/dashboard', {
            locals,
            data,
            layout: adminLayout
        });
    } catch (error) {
        console.log(error)
    }

});

// channels
router.get('/channels/:name', authMiddleware, async (req, res) => {
    try {
        const channel = await Channel.findOne({
            name: req.params.name
        });
        if (!channel) {
            return res.status(404).json({ message: 'channel not found' });
        }
        const locals = {
            title: channel.name,
            description: channel.description
        };
        const posts = await Post.find({ channel: channel._id })
        res.render('channel', {
            locals,
            channel,
            posts,
            layout: adminLayout
        })
    } catch (error) {
        console.log(error);
    }
})


// adding post
router.get('/add-post', authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: 'add post',
            description: 'add a new post'
        };
        const channels = await Channel.find();
        res.render('admin/add-post', {
            locals,
            channels,
            layout: adminLayout
        })
    } catch (error) {
        console.log(error)
    }
});

router.post('/add-post', authMiddleware, async (req, res) => {
    try {
        const { title, body, channel } = req.body;
        const newPost = new Post({ title, body, channel });
        await newPost,save();
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.log(error);
    }
});

// edit post
router.get('/edit-post/:id', async (req, res) => {
    try {

        const locals = {
            title: "edit post",
            description: "edit your post"
        }
        const data = await Post.findById(req.params.id);
        const channels = await Channel.find();
        res.render('admin/edit-post', {
            locals,
            data,
            layout: adminLayout
        })
    } catch (error) {
        console.log(error)
    }
});

router.put('/edit-post/:id', async (req, res) => {
    try {
        const { title, body, channel } = req.body;
        await Post.findByIdAndUpdate(req.params.id, {
            title,
            body,
            updatedAt: Date.now()
        });
        res.redirect(`/admin/edit-post/${req.params.id}`)
    } catch (error) {
        console.log(error)
    }
});

// delete post
router.delete('/delete-post/:id', async (req, res) => {
    try {
        await Post.deleteOne( { _id: req.params.id } );
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.log(error);
    }
});


module.exports = router;