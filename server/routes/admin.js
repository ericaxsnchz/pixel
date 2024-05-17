const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const adminLayout = '../views/layouts/admin';
const jwtSecret = process.env.JWT_SECRET;

// check login
// const authMiddleware = (req, res, next) => {
//     const token = req.cookies.token;
    
//     if(!token) {
//         return res.status(401).json({ message: 'unauthorized' });
//     } 

//     try {
//         const decoded = jwt.verify(token, jwtSecret);
//         req.userId = decoded.userId;
//         next();
//     } catch (error) {
//         res.status(401).json({ message: 'unauthorized' });
//     }
// }




// // admin - login page
// router.get('/admin', async (req, res) => {
//     try {
//         const locals = {
//             title: "admin",
//             description: "add to the discusssion"
//         }

//         res.render('admin/login', { locals, layout: adminLayout });
//     } catch (error) {
//         console.log(error);
//     }
// });

// // admin - check login

// router.post('/admin', async (req, res) => {
//     try {
//         const { username, password } = req.body;
//         const user = await User.findOne( {username} );

//         if(!user) {
//             return res.status(401).json( {message: 'Invalid credentials' });
//         }

//         const isPasswordValid = await bcrypt.compare(password, user.password);
//         if(!isPasswordValid) {
//             return res.status(401).json( {message: 'Invalid credentials' });
//         }
        
//         const token = jwt.sign( {userId: user._id}, jwtSecret )
//         res.cookie('token', token, { httpOnly: true })

//         res.redirect('/dashboard');

//     } catch (error) {
//         console.log(error);
//     }
// });

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

// create new post 
router.get('/add-post', async (req, res) => {
    try {
        const locals = {
            title: "add post",
            description: "add to the discusssion"
        }
        const data = await Post.find();
        res.render('admin/add-post', {
            locals,
            layout: adminLayout
        });
    } catch (error) {
        console.log(error)
    }
});

// adding post
router.post('/add-post', async (req, res) => {
    try {
        try {
            const newPost = new Post({
                title: req.body.title,
                body: req.body.body
            });
            await Post.create(newPost);
            res.redirect('/dashboard');
        } catch (error) {
         console.log(error)   
        }
    } catch (error) {
        console.log(error)
    }
});

// edit post
router.get('/edit-post/:id', async (req, res) => {
    try {

        const locals = {
            title: "add post",
            description: "add to the discusssion"
        }

        const data = await Post.findOne({ _id: req.params.id });


        res.render('admin/edit-post', {
            locals,
            data,
            layout: adminLayout
        })
    } catch (error) {
        console.log(error)
    }
});


// edit post
router.put('/edit-post/:id', async (req, res) => {
    try {
        await Post.findByIdAndUpdate(req.params.id, {
            title: req.body.title,
            body: req.body.body,
            updatedAt: Date.now()
        });
        res.redirect(`/edit-post/${req.params.id}`)
    } catch (error) {
        console.log(error)
    }
});

// delete post
router.delete('/delete-post/:id', async (req, res) => {
    try {
        await Post.deleteOne( { _id: req.params.id } );
        res.redirect('/dashboard');
    } catch (error) {
        console.log(error);
    }
});

// register

// router.post('/register', async (req, res) => {
//     try {
//         const { username, password } = req.body;
//         const hashedPassword = await bcrypt.hash(password, 10);

//         try {
//             const user = await User.create({ username, password: hashedPassword});
//             res.status(201).json({ message: 'User Created', user })
//         } catch (error) {
//             if (error.code === 11000) {
//                 res.status(409).json({ message: 'User already in use' });
//             }
//             res.status(500).json({ message: 'Internal server error' })
//         }
//     } catch (error) {
//         console.log(error);
//     }
// });


module.exports = router;