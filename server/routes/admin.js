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
    console.log('Auth Middleware: Checking authentication');
    console.log('User authenticated:', req.isAuthenticated());
    console.log('User:', req.user);


    if(req.isAuthenticated()) {
        return next();
    } else {
        res.status(401).json({ message: 'unauthorized' });
    }

    // try {
    //     const decoded = jwt.verify(token, jwtSecret);
    //     req.userId = decoded.userId;
    //     req.username = decoded.username;
    //     req.user = {
    //         _id: decoded.userId,
    //         username: decoded.username
    //     }
    //     console.log('Session:', req.session);
    //     console.log('User:', req.user);
    //     next();
    // } catch (error) {
    //     console.log('JWT verification error:', error);
    //     res.status(401).json({ message: 'unauthorized' });
    // }
}

// register
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'username and password required' })
        }
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'username already exists' });
        }
        const User = new User({
            username,
            password
        });
        await User.save();
    } catch (error) {
        console.log('Registration error:', error);
        res.status(500).json({ message: 'internal server error' })
    }
});

// login
router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;
    //     const user = await User.findOne( {username} );

        console.log('login attempt: ', req.body);
        passport.authenticate('local', (err, user, info) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                req.flash('error', info.message);
                return res.redirect('/login');
            }
            req.logIn(user, (err) => {
                if (err) {
                    return next(err);
                }
                return res.redirect('/admin/dashboard');
            });

        }) (req, res, next);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'server error' })
    }

        // if(!user) {
        //     req.flash('error', 'invalid credentials');
        //     return res.status(401).redirect('/login');
        // }

        // const isPasswordValid = await bcrypt.compare(password, user.password);
        // if(!isPasswordValid) {
        //     req.flash('error', 'invalid credentials2');
        //     return res.status(401).redirect('/login');
        // }

        // console.log("Authenticated user:", user);
        
        // const token = jwt.sign( {userId: user._id}, jwtSecret )
        // res.cookie('token', token, { httpOnly: true })

        // res.redirect('/admin/dashboard');

    // } catch (error) {
    //     console.log(error);
    //     res.status(500).json({ message: 'Server error' });
    // }
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
        console.log('Add Post Route: User ID:', req.user);
        console.log('Add Post Route: Username:', req.username);
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
            user: req.user,
            username: req.username
        });
        await newPost.save();
        res.redirect(`/admin/channels/${channelDoc.name}`);
    } catch (error) {
        console.log(error);
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

        const channels = await Channel.find();
        const channel = await Channel.findById(postData.channel);
        res.render('admin/edit-post', {
            locals,
            data: postData,
            channels,
            channel,
            layout: adminLayout,
            user: req.user
        });
    } catch (error) {
        console.log(error)
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
        console.log(error)
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