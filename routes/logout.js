const express = require('express');
const router = express.Router();
const User = require("../models/user");

router.get("/", (req, res, next) => { // next を引数に追加
    req.logout((err) => { // コールバック関数を追加
        if (err) {
            console.error("ログアウトエラー:", err);
            return next(err); // エラー処理ミドルウェアに渡す
        }
        res.redirect("/home");
    });
});

module.exports = router;
