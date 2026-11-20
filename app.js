const express = require("express");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const bodyParser = require("body-parser");
const userModel = require("./models/users");
const tasksRoute = require("./routes/tasks");
const session = require("express-session");
const db = require("./config/db");
const logger = require("./utils/logger");
const path = require("path");
const flash = require('connect-flash');
const MongoStore = require("connect-mongo").default;
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
    cookie: { maxAge: 5 * 60 * 1000 },
  }),
);

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use(passport.session());
app.use(flash());


// Make flash messages available to every EJS page
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success');
    res.locals.error_msg = req.flash('error');
    next();
});

passport.use(userModel.createStrategy());
passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());


app.set("views", "views");
app.set("view engine", "ejs");

app.use("/tasks", connectEnsureLogin.ensureLoggedIn(), tasksRoute);

app.get("/", (req, res) => {
  res.redirect("/signup");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/reset", (req, res) => {
  res.render("reset");
});

app.post("/signup", async (req, res) => {
  const { username, password, email } = req.body;
  try {
    const user = await userModel.register(
      new userModel({ username, email }),
      password,
    );
    //login the newly registerd user
    req.login(user, (error) => {
      if (error) {
        logger.error(error);
        return res.status(500).render("signup", {
          error: "Unable to log in after registration",
        });
      }
      //generate jwt
      const token = jwt.sign(
        {
          userId: user._id,
          username: user.username,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "5m",
        },
      );
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 5 * 60 * 1000,
        path: "/",
      });

      return res.redirect("/tasks");
    });
  } catch (error) {
    logger.error(error);
    if (error.code === 11000) {
      return res.status(409).render("signup", {
        error: "email already registered",
      });
    }
    return res.status(400).render("signup", {
      error: error.message,
    });
  }
});

app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/login" }),
  (req, res) => {
    const token = jwt.sign(
      {
        userId: req.user._id,
        username: req.user.username,
      },
      process.env.JWT_SECRET,
      {
        //expres with the same duration as the session
        expiresIn: "5m",
      },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 5 * 60 * 1000,
    });

    res.redirect("/tasks");
  },
);

app.post("/logout", (req, res, next) => {
  const userId = req.user?._id?.toString();
  //log user out of passport
  req.logout((error) => {
    if (error) {
      return next(error);
    }
    //destroy session for the user stored on the server
    req.session.destroy((error) => {
      if (error) {
        return next(error);
      }

      //clear JWT cookie
      res.clearCookie("token", {
        httpOnly: true, //this help prevent attackers from injecting malicious js 
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });

      //clear passport session cookie which removes the session identifier from the browser ref:line  149
      res.clearCookie("connect.sid", {
        path: "/",
      });

      //disconnect the users active sockets
      const io = req.app.get("io");

      if (io && userId) {
        for (const socket of io.sockets.sockets.values()) {
          if (String(socket.user?.userId) === userId) {
            socket.disconnect(true);
          }
        }
      }
      return res.redirect("/login");
    });
  });
});

app.get("/reset", (req, res) => {
  res.render("reset");
});

app.post("/reset", async (req, res) => {
  const { username, password, new_password } = req.body;
  try {
    const user = await userModel.findOne({ username });
    if (!user) {
      return res.status(404).render("reset", {
        error: "User not found",
      });
    }
    await user.changePassword(password, new_password);
    res.redirect("/login");
  } catch (error) {
    logger.error(error);
    return res.status(404).render("reset", {
      error: error.message,
    });
  }
});
app.use((err, req, res, next) => {
  logger.error(err);
});

module.exports = app;
