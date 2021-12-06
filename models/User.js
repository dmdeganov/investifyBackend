const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    userName: String,
    cash: Number,
    watchlist: Array,
    holdings: Array,
    password: String,
  },
  {
    versionKey: false, // You should be aware of the outcome after set to false
  }
);

// const UserSchema = new mongoose.Schema({ any: {} });
module.exports = mongoose.model("User", UserSchema);
