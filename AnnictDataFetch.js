const mongoose = require("mongoose");
const express = require("express");
const axios = require("axios"); 
const app = express();
const path = require("path");
//環境変数の設定
require('dotenv').config();
const AccessToken = process.env.ACCESS_TOKEN;


// MongoDBへの接続
mongoose.connect('mongodb+srv://go0630mameshiba:ZpoFid2BIyhPEahs@cluster0.j1dqg18.mongodb.net/?retryWrites=true&w=majority&appName=Cluster', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => {
      console.log('MongoDBに接続しました');
    })
    .catch((err) => {
      console.error('MongoDBへの接続に失敗しました', err);
    });

const AnnictResSchema = new mongoose.Schema({}, { strict: false });
const AnnictRes = mongoose.model("AnnictRes", AnnictResSchema);

//指定した季節アニメ達をannictから取ってきてdbに保存する
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


const AnnictKonki = async () => {
    try {
        // MongoDB から `2025-winter` シーズンのデータを取得
        const animes = await AnnictRes.find({ season_name: "2025-winter" });

        // TVアニメのみにフィルタリング
        const filteredWorks = animes.filter(work => work.media === "tv");

        // 視聴数が多い順にソート
        filteredWorks.sort((a, b) => b.watchers_count - a.watchers_count);

        return filteredWorks;
        console.log(filteredWorks);
        return;
    } catch (error) {
        console.error(error);
        return [];
    }
}
    


