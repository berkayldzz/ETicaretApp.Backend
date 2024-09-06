const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const { v4: uuidv4 } = require("uuid");
const upload = require("../services/file.service");
const response = require("../services/response.service");
const fs = require("fs");

router.post("/add", upload.array("images"), async (req, res) => {
  response(res, async () => {
    const { name, stock, price, categories } = req.body;
    const productId = uuidv4();
    let product = new Product({
      _id: productId,
      name: name.toUpperCase(),
      stock: stock,
      price: price,
      categories: categories,
      isActive: true,
      imageUrls: req.files,
      createdDate: new Date(),
    });

    await product.save();

    res.json({ message: "Ürün kaydı başarıyla tamamlandı" });
  });
});

// ürünün kendisini silmeden önce ürünü bulup resmini silmemiz gerekir.Daha sonra ürünün kendisini sileriz.best practices
router.post("/removeById", async (req, res) => {
  response(res, async () => {
    const { _id } = req.body;

    const product = await Product.findById(_id);

    // ürünün resimlerini sildim
    for (const image of product.imageUrls) {
      fs.unlink(image.path, () => {});
    }
    await Product.findByIdAndDelete(_id);
    res.json({ message: "Ürün kaydı başarıyla silindi!" });
  });
});

// pagination işlemini db den çekerken yaparsak daha performanslı bir yaklaşım olur
// search ile beraber oluşturduk
// Ürün Listesi Getir

router.post("/", async (req, res) => {
  response(res, async () => {
    const { pageNumber, pageSize, search } = req.body;

    // mevcut ürünlerin toplam sayısı
    let productCount = await Product.find({
      $or: [
        {
          name: { $regex: search, $options: "i" },
        },
      ],
    }).countDocuments();

    // listemizi elde ediyoruz
    let products = await Product.find({
      $or: [
        {
          name: { $regex: search, $options: "i" },
        },
      ],
    })
      .sort({ name: 1 })
      .populate("categories")
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    let totalPageCount = Math.ceil(productCount / pageSize);

    // dönecek modelimizi oluşturduk.
    let model = {
      datas: products,
      pageNumber: pageNumber,
      pageSize: pageSize,
      totalPageCount: totalPageCount,
      isFirstPage: pageNumber == 1 ? true : false,
      isLastPage: totalPageCount == pageNumber ? true : false,
    };

    res.json(model);
  });
});

//Ürünün Aktif/Pasif Durumunu Değiştir
router.post("/changeActiveStatus", async (req, res) => {
  response(res, async () => {
    const { _id } = req.body;
    let product = await Product.findById(_id);
    product.isActive = !product.isActive;
    await Product.findByIdAndUpdate(_id, product);
    res.json({ message: "Ürünün durumu başarıyla değiştirildi!" });
  });
});

router.post("/getById", async (req, res) => {
  response(res, async () => {
    const { _id } = req.body;
    const product = await Product.findById(_id);
    res.json(product);
  });
});

router.post("/update", upload.array("images"), async (req, res) => {
  response(res, async () => {
    // güncelleyeceğimiz verileri aldık
    const { _id, name, stock, price, categories } = req.body;
    // productı bulduk
    let product = await Product.findById(_id);

    //imageUrls değişkeni, mevcut resim URL'leri ile yeni yüklenen resimleri (req.files) birleştirir.
    let imageUrls;
    imageUrls = [...product.imageUrls, ...req.files];

    product = {
      name: name.toUpperCase(),
      stock: stock,
      price: price,
      imageUrls: imageUrls,
      categories: categories,
    };
    await Product.findByIdAndUpdate(_id, product);
    res.json({ message: "Ürün kaydı başarıyla güncellendi!" });
  });
});

// ürün resmi silme
router.post("/removeImageByProductIdAndIndex", async (req, res) => {
  response(res, async () => {
    // index ile kaçıncı resim olduğunu bilicez.
    const { _id, index } = req.body;

    let product = await Product.findById(_id);
    if (product.imageUrls.length == 1) {
      res.status(500).json({
        message:
          "Son ürün resmini silemezsiniz! En az 1 ürün resmi bulunmak zorundadır!",
      });
    }
    // birden fazla ürün resmi varsa
    else {
      let image = product.imageUrls[index]; // seçili resmi bulalım
      product.imageUrls.splice(index, 1); //  seçili resim, imageUrls listesinden çıkarılır.
      await Product.findByIdAndUpdate(_id, product);
      fs.unlink(image.path, () => {}); // dosya sistemindeki resim silinir.
      res.json({ message: "Resim başarıyla kaldırıldı!" });
    }
  });
});

// ana sayfa için ürün listesini getir

router.post("/getAllForHomePage", async (req, res) => {
  response(res, async () => {
    const { pageNumber, pageSize, search, categoryId, priceFilter } = req.body;
    let products;
    // herhangi bir filtreleme yapmadıysak
    if (priceFilter == "0") {
      products = await Product.find({
        isActive: true,
        categories: { $regex: categoryId, $options: "i" },
        $or: [
          {
            name: { $regex: search, $options: "i" },
          },
        ],
      })
        .sort({ name: 1 })
        .populate("categories");
    } else {
      products = await Product.find({
        isActive: true,
        categories: { $regex: categoryId, $options: "i" },
        $or: [
          {
            name: { $regex: search, $options: "i" },
          },
        ],
      })
        .sort({ price: priceFilter })
        .populate("categories");
    }

    res.json(products);
  });
});

module.exports = router;
