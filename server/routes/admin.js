const express = require('express');
const passport = require('passport');
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
    if(req.isAuthenticated()) {
        return next();
    } else {
        res.status(401).json({ message: 'unauthorized' });
    }
}

// register
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'username and password required' });
        }
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'username already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        const savedUser = await User.findOne({ username });
        res.redirect('/login');
    } catch (error) {
        console.log('Registration error:', error);
        res.status(500).json({ message: 'internal server error' });
    }
});

// login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            console.error('Error during authentication:', err);
            return next(err);
        }
        if (!user) {
            console.log('Authentication failed:', info.message);
            req.flash('error', info.message);
            return res.redirect('/login');
        }
        req.login(user, (err) => {
            if (err) {
                console.error('Error during login:', err);
                return next(err);
            }
            console.log('User logged in successfully:', user.username);
            return res.redirect('/admin/dashboard');
        });
        console.log('Password received:', req.body.password);

    })(req, res, next);
});

// logout
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) { return next(err) }
        res.clearCookie('token');
        res.redirect('/login');
    })
});





// dashboard 
router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        const data = await Post.find().populate('channel');
        const currentUser = req.user;
        res.render('admin/dashboard', {
            data,
            layout: adminLayout,
            user: req.user
        });
    } catch (error) {
        console.log(error)
    }

});

// channels
router.get('/channels/:name', authMiddleware, async (req, res) => {
    try {
        const channelName = req.params.name;
        const channel = await Channel.findOne({ name: channelName });
        if (!channel) {
            return res.status(404).json({ message: 'channel not found' });
        }
        const locals = {
            title: channel.name,
            description: channel.description
        };
        const posts = await Post.find({ channel: channel._id }).populate('user').populate('channel');
        res.render('channel', {
            locals,
            channel,
            posts,
            currentUserId: req.userId,
            user: req.user,
            layout: adminLayout
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'internal server error'});
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
            layout: adminLayout,
            user: req.user
        })
    } catch (error) {
        console.log(error)
    }
});

router.post('/add-post', authMiddleware, async (req, res) => {
    try {
        const { body, channel } = req.body;
        const userId = req.userId;
        const channelDoc = await Channel.findById(channel);

        if (!channelDoc) {
            return res.status(404).json({ message: 'channel not found' });
        }

        const newPost = new Post({ 
            body, 
            channel: channelDoc._id,
            user: req.user,
            username: req.username
        });
        await newPost.save();
        res.redirect(`/admin/channels/${channelDoc.name}`);
    } catch (error) {
        console.log(error)
        res.status(500).send('Server error');
    }
});


// edit post
router.get('/edit-post/:id', authMiddleware, async (req, res) => {
    try {

        const locals = {
            title: "edit post",
            description: "edit your post"
        }
        const postId = req.params.id;
        const postData = await Post.findById(postId);

        if (!postData) {
            return res.status(404).json({ message: 'post not found' });
        }

        if (postData.user && postData.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'forbidden: you are not authorized to edit this post'});
        }

        const posts = await Post.find({ channel: postData.channel });

        const channels = await Channel.find();
        const channel = await Channel.findById(postData.channel);
        res.render('admin/edit-post', {
            locals,
            data: postData,
            channels,
            channel,
            posts,
            layout: adminLayout,
            user: req.user
        });
    } catch (error) {
    }
});

router.put('/edit-post/:id', authMiddleware, async (req, res) => {
    try {
        const { title, body, channel } = req.body;
        await Post.findByIdAndUpdate(req.params.id, {
            title,
            body,
            channel,
            updatedAt: Date.now()
        });

        const postData = await Post.findById(req.params.id);

        if (!postData) {
            return res.status(404).json({ message: 'post not found' });
        }

        if (postData.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'forbidden: you are not authorized to edit this post'});
        }

        const channelName = req.query.channel;
        res.redirect(`/admin/channels/${channelName}`)
    } catch (error) {
        res.status(500).send('server error')
    }
});

// delete post
router.delete('/delete-post/:id/:channelName', authMiddleware, async (req, res) => {
    try {
        const postId = req.params.id;

        const postData = await Post.findById(postId);

        if (!postData) {
            return res.status(404).json({ message: 'post not found' });
        }

        if (postData.user && postData.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'forbidden: you are not authorized to edit this post'});
        }

        await Post.deleteOne({ _id: postId });
        
        const channelName = req.params.channelName;
        res.redirect(`/admin/channels/${channelName}`)
    } catch (error) {
        console.log(error);
        res.status(500).send('server error');
    }
});



module.exports = router;