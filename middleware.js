//ログイン済みの場合のみエンドポイントを叩けるようにしたい場合このミドルウェアを呼ぶ
module.exports.isLoggedIn = (req, res, next) => {
 if(!req.isAuthenticated()) {
    return res.redirect("/login");
 }
 next();
}

