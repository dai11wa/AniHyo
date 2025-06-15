const express = require("express");
const axios = require("axios");
const app = express();
const ejsMate = require("ejs-mate");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const session =require("express-session");
const homeRoutes = require("./routes/home");
const mypageRoutes = require("./routes/mypage")
const loginRoutes = require("./routes/login");
const registerRoutes = require("./routes/register");
const logoutRoutes = require("./routes/logout");
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const methodOverride = require('method-override');
const cron = require("node-cron");
const mongoSanitize = require("express-mongo-sanitize");

//環境変数の設定
require('dotenv').config();
const AccessToken = process.env.ACCESS_TOKEN;
const mysecret = process.env.MYSECRET;

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

//---------------------ここからアニメ情報のデータベースをアップデートするコード------------------
const ResSaveFunc = async (season) => {
    try {
        let isNextPage = true;
        let page = 1;
        let animes = [];

        while (isNextPage) {
            const res = await axios.get(`https://api.annict.com/v1/works`, {
                params: {
                    access_token: AccessToken,
                    filter_season: season,
                    per_page: 40,
                    page: page
                }
            });
            if (res.data.works.length > 0) {
                animes.push(...res.data.works); // works配列の中身を追加
            }
            isNextPage = res.data.next_page !== null; // next_pageがnullなら終了
            page++;
        }
        if (animes.length > 0) {
            for (let anime of animes) {
                await AnnictRes.updateOne(
                    { id: anime.id }, // 同じidのデータがあれば更新
                    { $set: anime },
                    { upsert: true } //なければ追加
                );
            }
            console.log("データの保存が完了しました。");
        } else {
            console.log("データがありません");
        }
    } catch (error) {
        console.error("データ取得エラー:", error);
    }
};

//現在の季節を返す関数（例：2025-winter）
function getCurrentSeason() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
  
    let season;
    if (month >= 1 && month <= 3) season = "winter";
    else if (month >= 4 && month <= 6) season = "spring";
    else if (month >= 7 && month <= 9) season = "summer";
    else season = "autumn";
  
    return `${year}-${season}`;
  }
  let season = getCurrentSeason();
//朝5時にデータベース更新関数を実行
cron.schedule("0 5 * * *", () => {
    ResSaveFunc(season)
    console.log("朝の5時にアニメ情報を更新")
});

//----------ここまでアニメ情報のデータベースをアップデートするコード-----------------

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

//method-overrideを設定
app.use(methodOverride('_method'));

//mongoインジェクションを防止
app.use(mongoSanitize());

//セッションとフラッシュの設定
const sessionConfig = {
    secret: mysecret, 
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};
app.use(session(sessionConfig));

//passporの設定
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//flashの設定
app.use(flash());
app.use((req, res, next) => {
    res.locals.currentUser = req.user
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

//ルーティング
app.use("/login", loginRoutes);
app.use("/register", registerRoutes);
app.use("/logout", logoutRoutes);
app.use("/home", homeRoutes);
app.use("/mypage", mypageRoutes);

//どのルートともマッチしなかった場合
app.all('*', (req, res, next) => {
    res.status(404) 
    res.render('404') 
});

app.listen(3000, () => {
    console.log("ポート3000で受付中");
});