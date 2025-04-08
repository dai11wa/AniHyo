const express = require("express");
const axios = require("axios");
const app = express();
const ejsMate = require("ejs-mate");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require('body-parser');

//passportのログイン機能関連
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
app.use(session({
    secret: 'your secret phrase',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// URLエンコードされたデータを解析するミドルウェアを設定（フォームデータなど）
app.use(bodyParser.urlencoded({ extended: true }));

// JSON形式のデータを解析するミドルウェアを設定
app.use(bodyParser.json());


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

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//環境変数
const AccessToken = "P5O8f0cbBkGCromk1Jma6OvjgEqMQHBFwbxf7gTQzTA"

//今期（2025冬）のアニメオブジェクトが入った、配列を返す関数
const AnnictKonki = async () => {
    try {
        let isNextPage = true;
        let page = 1;
        let animes = []
        while (isNextPage) {
            const res = await axios.get(`https://api.annict.com/v1/works?access_token=${AccessToken}&filter_season=2025-winter&per_page=40&page=${page}`);
            //TV放送のもののみにする
            const filteredWorks = res.data.works.filter(work => {
                return work.media === "tv";
            });
            animes.push(...filteredWorks);
            isNextPage = res.data.next_page;
            page++;
        }
        //視聴数が多い順にソート
        animes.sort((a, b) => {
            return b.watchers_count - a.watchers_count;
        });
        return animes;
    } catch (error) {
        console.error(error);
        return [null]
    }
};

//workIdをもとにタイトルと画像url取ってきて返す関数
const workImageFunc = async (workId) => {
    const res = await axios.get(`https://api.annict.com/v1/works?access_token=${AccessToken}&filter_ids=${workId}`);
    const imageURL = res.data.works[0].images.facebook.og_image_url;
    const workTitle = res.data.works[0].title;
    return [workTitle, imageURL];
}

//ホームページ
app.get("/home", async (req, res) => {
    const animes = await AnnictKonki();
    if (animes) {
        res.render("home", { animes });
    } else {
        res.send("データの取得に失敗");
    }
});

//作品詳細ページ
app.get("/home/:id", async (req, res) => {
    const workId = req.params.id;
    const funcResult = await workImageFunc(workId);
    const workTitle = funcResult[0];
    const imageURL = funcResult[1];
    res.render("work", { workTitle, imageURL })
});

app.get("/register", async(req, res) => {
    res.render("register")
});

//ユーザー登録ページ
app.post('/register', async (req, res) => {
    console.log(req.body);
    try {
        const user = new User({ username: req.body.username, email: req.body.email });
        const registeredUser = await User.register(user, req.body.password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            res.redirect("/home");
        });
    } catch (e) {
        res.send('登録エラー: ' + e.message);
    }
});


app.listen(3000, () => {
    console.log("ポート3000で受付中");
});
