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

        res.redirect('/admin/dashboard');

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
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
        const data = await Post.find().populate('channel');
        const currentUser = req.user;
        res.render('admin/dashboard', {
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
        const channelName = req.params.name;
        console.log('channel name:', channelName);
        const channel = await Channel.findOne({ name: channelName });
        if (!channel) {
            return res.status(404).json({ message: 'channel not found' });
        }
        console.log('channel found: ', channel);
        const locals = {
            title: channel.name,
            description: channel.description
        };
        const posts = await Post.find({ channel: channel._id }).populate('user');
        res.render('channel', {
            locals,
            channel,
            posts,
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
            layout: adminLayout
        })
    } catch (error) {
        console.log(error)
    }
});

router.post('/add-post', authMiddleware, async (req, res) => {
    try {
        const { title, body, channel } = req.body;
        const userId = req.userId;
        const channelDoc = await Channel.findById(channel);

        if (!channelDoc) {
            return res.status(404).json({ message: 'channel not found' });
        }

        const newPost = new Post({ 
            title, 
            body, 
            channel: channelDoc._id,
            user: req.userId
        });
        await newPost.save();
        res.redirect(`/admin/channels/${channelDoc.name}`);
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
});


// edit post
router.get('/edit-post/:id', async (req, res) => {
    try {

        const locals = {
            title: "edit post",
            description: "edit your post"
        }
        const postId = req.params.id;
        const postData = await Post.findById(postId);
        const channels = await Channel.find();
        const channel = await Channel.findById(postData.channel);
        res.render('admin/edit-post', {
            locals,
            data: postData,
            channels,
            channel,
            layout: adminLayout
        });
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
            channel,
            updatedAt: Date.now()
        });
        const channelName = req.query.channel;
        res.redirect(`/admin/channels/${channelName}`)
    } catch (error) {
        console.log(error)
        res.status(500).send('server error')
    }
});

// delete post
router.delete('/delete-post/:id/:channelName', async (req, res) => {
    try {
        const postId = req.params.id;
        await Post.deleteOne({ _id: postId });
        
        const channelName = req.params.channelName;
        res.redirect(`/admin/channels/${channelName}`);
    } catch (error) {
        console.log(error);
        res.status(500).send('server error');
    }
});



module.exports = router;