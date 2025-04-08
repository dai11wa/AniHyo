const mongoose = require("mongoose");
const express = require("express");
const axios = require("axios"); 
const app = express();
const path = require("path");


const AccessToken = "P5O8f0cbBkGCromk1Jma6OvjgEqMQHBFwbxf7gTQzTA"

// MongoDBへの接続
mongoose.connect('mongodb://localhost:27017/AniHyo', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => {
      console.log('MongoDBに接続しましたこちらfunctest');
    })
    .catch((err) => {
      console.error('MongoDBへの接続に失敗しました', err);
    });

//AnnictKonki関数呼び出しlog出汁
const { AnnictKonki } = require("./AnnictDataFetch.js");

const  test = async function(){
    const res = await AnnictKonki();
    console.log(res);
}

test();
