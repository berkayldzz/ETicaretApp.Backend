const multer = require("multer");

// Burada dosya kaydedeceğimiz bir yapı kurduk.

//storage bizim kaydedilecek yer ve dosya adı bilgisini tutar.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
