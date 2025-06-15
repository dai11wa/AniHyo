const express = require('express');
const router = express.Router();
const User = require("../models/user");

router.get("/", async(req, res) => {
    res.render("register");
});

//登録ページ
router.post('/', async (req, res) => {
    try {
        const user = new User({ username: req.body.username, email: req.body.email });
        const registeredUser = await User.register(user, req.body.password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash("success", "アカウント登録が完了しました")
            res.redirect("/home");
        });
    } catch (e) {
        res.send('登録エラー: ' + e.message);
    }
});

module.exports = router;