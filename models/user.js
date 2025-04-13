const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema; 

const ReviewSchema = new Schema({
    episode: Number,
    comment: String,
    score: Number
  });

  const MyListSchema = new Schema({
    AnnictId: Number,
    isReviewed: {
      type: Boolean,
      default: false
    },
    currentAve: Number,
    previousReviewedEpisode: Number,
    reviews: [ReviewSchema] // ReviewSchema を要素とする配列
  });

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    mylist: [MyListSchema]
});

//usernameとhashとsalt等をパスポートが追加してくれる
UserSchema.plugin(passportLocalMongoose); 

module.exports = mongoose.model('User', UserSchema);
