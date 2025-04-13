const mongoose = require('mongoose');

const AnnictResSchema = new mongoose.Schema({
  season_name: String,
  media: String,
}, { strict: false }); 

const AnnictRes = mongoose.model('AnnictRes', AnnictResSchema, 'annictres');
// 第3引数 'annictres' は、MongoDB上のコレクション名を明示的に指定

module.exports = AnnictRes;