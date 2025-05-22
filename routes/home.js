const axios = require("axios");
const express = require('express');
const AnnictRes = require('../models/annictress');
const { isLoggedIn } = require("../middleware");
const router = express.Router();
//環境変数の設定
require('dotenv').config();
const AccessToken = process.env.ACCESS_TOKEN;



//ホームページ、マイリストに入っているかどうかもhome.ejsに渡す
router.get("/", async (req, res) => {
    try {
        const animes = await AnnictRes.find({ season_name: '2025-winter', media: 'tv' })
            .lean()
            .sort({ watchers_count: -1 })
            .exec();
        if (req.user) {
            const userMylist = req.user.mylist.map(item => item.AnnictId);
            return res.render("home", { animes, userMylist });
        }
        res.render("home", { animes });
    } catch (error) {
        console.error("MongoDBからのデータ取得エラー:", error);
        res.send("申し訳ありませんデータの取得に失敗しました (MongoDB)");
    }

});

//評価のpostリクエストを処理し、DBに保存
router.post("/:id/hyoka", isLoggedIn, async (req, res) => {
    const workId = parseInt(req.params.id);
    try {
        let mylistItem = req.user.mylist.find(item => item.AnnictId === workId);
        const episodeNumber = parseInt(req.body.episodeNumber);
        const score = parseFloat(req.body.score);
        const comment = req.body.comment;

        //mylistに入っていなかった場合、mylistにこのアニメを追加した後、評価情報を保存し処理を終了する
        if (!mylistItem) {
            const newItem = {
                AnnictId: workId,
                currentAve: score,
                previousReviewedEpisode: episodeNumber,
                isReviewed: true,
                reviews: [{ episode: episodeNumber, commen: comment, score: score }]
            };
            req.user.mylist.push(newItem);
            await req.user.save();
            return res.redirect(`/home/${workId}`);
        }
        //isReviewedを変更
        if (!mylistItem.isReviewed) {
            mylistItem.isReviewed = true;
        }
        //previousReviewedEpisodeを更新
        mylistItem.previousReviewedEpisode = episodeNumber;
        //reviews配列にスコア、コメント、エピソード番号を保存（すでに評価済みの回なら更新する)
        let previousValuedEpisode = mylistItem.reviews.find((element) => element.episode === episodeNumber);
        if (previousValuedEpisode) {
            previousValuedEpisode.comment = comment;
            previousValuedEpisode.score = score;
        } else {
            mylistItem.reviews.push({ episode: episodeNumber, comment:comment, score: score });
        }
        //currentAveを更新
        if (mylistItem.reviews.length > 0) {
            const totalScore = mylistItem.reviews.reduce((sum, review) => sum + review.score, 0);
            mylistItem.currentAve = totalScore / mylistItem.reviews.length;
        } else {
            mylistItem.currentAve = 0;
        }
        //MongoDBに評価を保存
        await req.user.save();
        res.redirect(`/home/${workId}`);

    } catch (error) {
        console.error("評価情報のMongDB書き込みエラー：", error);
        res.send("評価情報の保存に失敗しました");
    }
});



//作品詳細ページ (workImageFunc は必要に応じて修正または再利用)
router.get("/:id", async (req, res) => {
    const workId = parseInt(req.params.id);
    try {
        const anime = await AnnictRes.findOne({ id: workId });
        const episodes = await searchEpisodes(workId);
        let thisAnimeInfo = null;

        if (req.user) {
            thisAnimeInfo = req.user.mylist.find((element) => element.AnnictId === workId);
        }

        if (anime) {
            res.render("work", { workTitle: anime.title, imageURL: anime.images.facebook.og_image_url, episodes, workId, thisAnimeInfo });
        } else {
            res.send(workId);
        }
    } catch (error) {
        console.error("MongoDBからの作品詳細データ取得エラー:", error);
        res.send("作品詳細データの取得に失敗しました");
    }
});


//作品idが持つエピソードを入れる関数
async function searchEpisodes(id) {
    let isNextPage = true;
    let page = 1;
    let foundEpisodes = [];
    while (isNextPage) {
        const res = await axios.get("https://api.annict.com/v1/episodes", {
            params: {
                access_token: AccessToken,
                filter_work_id: id,
                per_page: 20,
                page: page
            }
        });
        foundEpisodes.push(...res.data.episodes);
        foundEpisodes.sort((a, b) => a.number - b.number);
        isNextPage = res.data.next_page !== null; // `next_page` が null なら終了
        page++;
        if (page > 10) {
            console.log("取得ページ数が上限に達しました。ループを終了します。");
            isNextPage = false;
        }
    }
    return foundEpisodes;
}


//マイリストに追加
router.post("/:id", isLoggedIn, async (req, res) => {
    const workId = parseInt(req.params.id);
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
        } else {
            res.json({ success: true });
        }
    } catch (error) {
        console.error("MongoDBからの作品詳細データ取得エラー:", error);
        res.send("作品詳細データの取得に失敗しました");
    }
});



module.exports = router;