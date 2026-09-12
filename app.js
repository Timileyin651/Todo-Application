const express = require('express');
const passport = require('passport');
const connectEnsureLogin = require('connect-ensure-login');
const bodyParser = require('body-parser')
const userModel = require('./models/users')
const tasksRoute = require('./routes/tasks')
const session = require('express-session')
const db = require('./config/db')
const logger = require('./utils/logger')
require('dotenv').config()

const PORT = process.env.PORT || '0.0.0.0';
const HOST = process.env.HOST || 'localhost';
const app = express();

//connect to db
db.connectToMongoDB();

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave:false,
     saveUninitialized:true,
     cookie: { maxAge: 5 * 60 * 1000 }
}));

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(userModel.createStrategy());
passport.serializeUser(userModel.serializeUser())
passport.deserializeUser(userModel.deserializeUser())

app.set('views','views')
app.set('view engine', 'ejs')

app.use('/tasks', connectEnsureLogin.ensureLoggedIn(), tasksRoute);

app.get('/',(req,res) => {
    res.redirect('/signup')
})

app.get('/login',(req,res) =>{
    res.render('login')
})

app.get('/signup',(req,res)=>{
    res.render('signup')
})

app.get('/reset', (req, res) => {
    res.render('reset');
});


app.post('/signup', async (req,res) => {
    const {username, password} = req.body;
    try {
        const user = await userModel.register(
            new userModel({username}),
            password
        );
        passport.authenticate('local')(req,res, async () =>{
            res.redirect('/tasks')
        });
    } catch (error) {
        logger.error(error)
        if(error.code === 11000){
            return res.status(409).render('signup',{
            error: 'email already registered'
        })   }
        return res.status(400).render('signup',{
            error: error.message
        })   
    }
})


app.post('/login', passport.authenticate('local', {failureRedirect: '/login' }), (req,res) =>{
    res.redirect('/tasks');
});

app.post('/logout', (req, res, next) => {
    req.logout((error =>{
        return next(error)
    }))
    res.redirect('/login')
});

app.get('/reset',(req,res)=>{
    res.render('reset')
})

app.post('/reset', async (req,res)=>{
    const { username, password, new_password} = req.body;
    try {
        const user = await userModel.findOne({ username})
        if(!user){
            return res.status(404).render('reset', {
                error: 'User not found',
            })
        }
        await user.changePassword(password, new_password)
        res.redirect('/login')

    } catch (error) {
        logger.error(error)
        return res.status(404).render('reset',{
            error: error.message,
        })
        
    }
    
})
app.use((err,req,res,next)=>{
    logger.error(err);
})
app.listen(PORT, ()=>{
    console.log(`Server listening on port ${PORT}`)
})


