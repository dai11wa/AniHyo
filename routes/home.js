const axios = require("axios");
const express = require('express');
const AnnictRes = require('../models/annictress');
const { isLoggedIn } = require("../middleware");
const router = express.Router();

//ホームページ、マイリストに入っているかどうかもhome.ejsに渡す
router.get("/", async (req, res) => {
    try {
        const animes = await AnnictRes.find({ season_name: '2025-winter', media: 'tv' })
            .lean()
            .sort({ watchers_count: -1 })
            .exec();
        if (req.user) {
            const userMylist = req.user.mylist.map(item => item.AnnictId);
            console.log(userMylist);
            return res.render("home", { animes, userMylist });
        }
        res.render("home", { animes });
    } catch (error) {
        console.error("MongoDBからのデータ取得エラー:", error);
        res.send("ほんまごめんデータの取得に失敗しました (MongoDB)");
    }

});


//作品詳細ページ (workImageFunc は必要に応じて修正または再利用)
router.get("/:id", async (req, res) => {
    const workId = parseInt(req.params.id); // ID は数値として保存されている可能性
    try {
        const anime = await AnnictRes.findOne({ id: workId });
        if (anime) {
            res.render("work", { workTitle: anime.title, imageURL: anime.images.facebook.og_image_url });
        } else {
            res.send(workId);
        }
    } catch (error) {
        console.error("MongoDBからの作品詳細データ取得エラー:", error);
        res.send("作品詳細データの取得に失敗しました");
    }
});

//マイリストに追加
router.post("/:id", isLoggedIn, async (req, res) => {
    const workId =parseInt(req.params.id);
    try {
        const existingItem = req.user.mylist.find(item => item.AnnictId === workId);
        if (!existingItem) {
            req.user.mylist.push({
                AnnictId: workId,
                currentAve: 0,
                previousReviewedEpisode: 0,
                reviews: []
              });
              await req.user.save(); 
            res.json({ success: true });
        }else{
            res.json({ success: true });
        }
    } catch (error) {
        console.error("MongoDBからの作品詳細データ取得エラー:", error);
        res.send("作品詳細データの取得に失敗しました");
    }
});



module.exports = router;