const express = require('express');
const AnnictRes = require('../models/annictress');
const { isLoggedIn } = require("../middleware");
const router = express.Router();
//環境変数の設定
require('dotenv').config();
const AccessToken = process.env.ACCESS_TOKEN;

//ホームページ、マイリストに入っているかどうかもhome.ejsに渡す
router.get("/", isLoggedIn, async (req, res) => {
    try {
        const listedAnimes = req.user.mylist //ユーザのマイリストにあるアニメ情報が配列で格納されている
        let userMylistIds = req.user.mylist.map(item => item.AnnictId);//単にマイリストのみが格納されている配列
        if (userMylistIds.length > 0) { 
            animes = await AnnictRes.find({ //Annictからの情報（画像url等）で構成されたオブジェクトの配列
                id: { $in: userMylistIds }, // AnnictId が userMylistIds 配列のいずれかに含まれるもの
                media: 'tv'
            })
            .lean()
            .exec();
        }
        res.render("reviewed", { userMylistIds, animes, listedAnimes });
    } catch (error) {
        console.error("MongoDBからのデータ取得エラー:", error);
        res.send("申し訳ありませんデータの取得に失敗しました (MongoDB)");
    }

});
module.exports = router;