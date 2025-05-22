const express = require("express");
const axios = require("axios");
const app = express();
const ejsMate = require("ejs-mate");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const session =require("express-session");
const homeRoutes = require("./routes/home");
const loginRoutes = require("./routes/login");
const registerRoutes = require("./routes/register");
const logoutRoutes = require("./routes/logout");
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');

//環境変数の設定
require('dotenv').config();
const AccessToken = process.env.ACCESS_TOKEN;

// MongoDBへの接続
mongoose.connect('mongodb://localhost:27017/AniHyo', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('MongoDBに接続しました');
    })
    .catch((err) => {
        console.error('MongoDBへの接続に失敗しました', err);
    });

//ejs、viewsの設定
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//静的ファイルの設定
app.use(express.static(path.join(__dirname, 'public')));

// URLエンコードされたデータを解析するミドルウェアを設定（フォームデータなど）
app.use(bodyParser.urlencoded({ extended: true }));

// JSON形式のデータを解析するミドルウェアを設定
app.use(bodyParser.json());

//セッションとフラッシュの設定
const sessionConfig = {
    secret: "mysecret", // ★ 秘密鍵は安全なものに変更してください
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};
app.use(session(sessionConfig));
app.use(flash());

//passporの設定
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//localsを設定するミドルウェア
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});

//ルーティング
app.use("/login", loginRoutes);
app.use("/register", registerRoutes);
app.use("/logout", logoutRoutes);
app.use("/home", homeRoutes);

app.listen(3000, () => {
    console.log("ポート3000で受付中");
});