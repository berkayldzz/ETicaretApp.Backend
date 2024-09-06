const express = require("express");
const router = express.Router();
const response = require("../services/response.service");
const Basket = require("../models/basket");
const { v4: uuidv4 } = require("uuid");
const Product = require("../models/product");

router.post("/add", async (req, res) => {
  response(res, async () => {
    const { userId, productId, price, quantity } = req.body;

    let basket = new Basket();
    basket._id = uuidv4();
    basket.userId = userId;
    basket.productId = productId;
    basket.price = price;
    basket.quantity = quantity;

    await basket.save();

    let product = await Product.findById(productId);
    product.stock -= quantity;
    await Product.findByIdAndUpdate(productId, product);

    res.json({ message: "Ürün başarıyla sepete eklendi!" });
  });
});

router.post("/removeById", async (req, res) => {
  response(res, async () => {
    const { _id } = req.body;

    let basket = await Basket.findById(_id);

    let product = await Product.findById(basket.productId);
    product.stock += basket.quantity;
    await Product.findByIdAndUpdate(basket.productId, product);

    await Basket.findByIdAndDelete(_id);

    res.json({ message: "Ürünü sepetten başarıyla kaldırdık!" });
  });
});

router.post("/", async (req, res) => {
  response(res, async () => {
    // o kullanıcıya ait sepeti ekrana getircez.
    const { userId } = req.body;

    //aggregate metodu, verileri işlemek için kullanılır ve burada belirli bir kullanıcıya ait sepetleri bulmak için userId eşleştirilir.
    const baskets = await Basket.aggregate([
      {
        $match: { userId: userId },
      },

      // ürün bilgisini elde edebilmem adına ilişkili veritabanını birleştirdik
      // SQL'deki JOIN işlemi gibi, başka bir koleksiyonla ilişkilendirir.

      //sepetin içinde hangi ürünlerin olduğunu öğrenmek için Basket içindeki productId'leri products koleksiyonundaki _id alanıyla eşleştirir
      {
        // Basket koleksiyonundaki productId değeri, products koleksiyonundaki _id değeriyle eşleşen kayıtlarla birleştirilir.
        $lookup: {
          from: "products", // Birleştirilecek olan koleksiyonun adını belirtir.
          localField: "productId",
          foreignField: "_id",
          as: "products", //  yeni alanın adını belirler.
        },
      },
    ]);

    res.json(baskets);
  });
});

// sepetteki ürün sayısını elde edelim

router.post("/getCount", async (req, res) => {
  response(res, async () => {
    const { userId } = req.body;
    const count = await Basket.find({ userId: userId }).countDocuments();
    res.json({ count: count });
  });
});
module.exports = router;
