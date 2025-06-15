const express = require('express');
const router = express.Router();
const passport = require("passport");

router.get("/", (req, res) => {
    res.render("login");
});
router.post("/", passport.authenticate("local", { failureRedirect: "/login"}), (req, res) => {
    req.flash("success", "ログイン完了")
    res.redirect("/home");
});

module.exports = router;