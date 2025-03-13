const express = require('express');
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require('cookie-parser');
const path = require("path");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.set("view engine" , "ejs");
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname,"public")));

app.get('/' , (req, res)=>{
    res.render("index");

});

app.post('/register' ,async (req, res)=>{
    let{email, password, username, name, age} = req.body;
    let user =await userModel.findOne({email: email});
    if(user){
        return res.status(500).send("User already registered");
    }
    else{
        bcrypt.genSalt(10 , (err, salt)=>{
            bcrypt.hash(password , salt ,async (err, hash)=>{
                let createduser = await userModel.create({
                    name:name,
                    username:username,
                    age:age,
                    email:email,
                    password:hash

                });
                let token = jwt.sign({email:email , userid: createduser._id}, "shhhh");
                res.cookie("token", token);
                res.send("registered");
            })
        })
    }

});

app.get('/login', (req, res)=>{
   res.render("login");
})

app.post('/login',async (req, res)=>{
    let{email, password} = req.body;
    let user = await userModel.findOne({email: email});
    if(!user){
        return res.send("something went wrong");
    }
    else{
        bcrypt.compare(password , user.password,(err , result)=>{
            if(result){
                let token = jwt.sign({email: email, userid: user._id }, "shhhh")
                res.cookie("token", token)
                res.redirect("/profile");

            }
            else{
                return res.send("something went wrong");
            }
            

        })
        
    }
})
app.get('/logout', (req , res)=>{
    res.cookie("token" , "");
    res.redirect("/login")
})


function isLoggedIn(req, res, next){
    if(req.cookies.token ==="") res.redirect("/login")
    else{
        let data=jwt.verify(req.cookies.token , "shhhh");
        req.user = data;
    }
    next();
}
app.get('/profile' ,isLoggedIn, async (req , res)=>{
    let user = await userModel.findOne({email: req.user.email}).populate("posts");
    res.render("profile" , {user: user});
})

app.post('/post' ,isLoggedIn, async (req , res)=>{
    let user = await userModel.findOne({email: req.user.email});
    let {content} = req.body;

    let post = await postModel.create({
        user: user._id,
        content: content
    })
    user.posts.push(post._id);
     await user.save();
     res.redirect("/profile")
    })

    app.get('/edit/:id' , isLoggedIn , async (req ,res)=>{
        let post = await postModel.findOne({_id: req.params.id})
        console.log(post);
        res.render("edit" ,{post : post})

    })
    app.post('/update/:id', isLoggedIn , async(req , res)=>{
        let post = await postModel.findOneAndUpdate({_id: req.params.id},{content : req.body.content})
        console.log(post);
        res.redirect("/profile")
    })
   
    app.get('/like/:id', isLoggedIn ,async (req, res)=>{
        let post = await postModel.findOne({_id: req.params.id}).populate("user")
        if(post.likes.indexOf(req.user.userid)===-1)
            {
                post.likes.push(req.user.userid)
            }
            else{
                post.likes.splice(post.likes.indexOf(req.user.userid),1)
            }
            await post.save();
            res.redirect("/profile")
    })


    
 


  

console.log("running")


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});