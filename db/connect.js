const mongoose = require("mongoose");
// const connectionString =
//   "mongodb+srv://James:bvg30081956@cluster0.lhr9k.mongodb.net/Investify?retryWrites=true&w=majority";

const connectDB = (url) => {
  return mongoose.connect(url, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  });
};
module.exports = connectDB;
