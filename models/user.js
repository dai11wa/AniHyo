const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    mylist: [{ type: Number }]  // AnnictのアニメIDを想定
});

UserSchema.plugin(passportLocalMongoose); // パスワードハッシュなどを自動で処理

const User = mongoose.model('User', UserSchema);
module.exports = User;
