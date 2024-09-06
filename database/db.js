const mongoose = require("mongoose");
require("dotenv").config();

// const uri =
//   "mongodb+srv://mongodb:1@eticartetdb.a1ra0.mongodb.net/?retryWrites=true&w=majority&appName=ETicartetDb";

const connection = () => {
  mongoose
    .connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDb bağlantısı başarılı!"))
    .catch((err) => console.log("Bağlantı Hatası! Hata: " + err.message));
};

module.exports = connection;
