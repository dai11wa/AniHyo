const mongoose = require("mongoose");

const annictRes = new mongoose.Schema({}, {_id: false, strict: false });
annictRes.add({_id: Number});

