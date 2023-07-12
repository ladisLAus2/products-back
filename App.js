const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });
app.use(cors);
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
});

// Створення моделі Product з використанням визначеної схеми
const Product = mongoose.model("Product", productSchema);

mongoose
  .connect(
    "mongodb+srv://admin:1234512345@productsapi.o5faifz.mongodb.net/?retryWrites=true&w=majority"
  )
  .then(() => {
    console.log("Connected to the database");
    app.listen(3001, () => {
      console.log("Server listening on port 3001");
    });
  })
  .catch((error) => {
    console.log(error);
  });

app.get("/postdata", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/getalldata", (req, res) => {
  // Знайти всі записи в колекції "products"
  Product.find()
    .then((products) => {
      res.json(products);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send("Помилка бази даних при отриманні даних");
    });
});

app.post("/products", upload.single("file"), (req, res) => {
  // Очистити попередні дані перед завантаженням нових
  Product.deleteMany({})
    .then(() => {
      // Отримуємо завантажений файл
      const filePath = req.file.path;

      // Читаємо вміст файлу
      fs.readFile(filePath, (err, data) => {
        if (err) {
          console.log(err);
          return res.status(500).send("Помилка при читанні файлу");
        }

        // Перетворюємо JSON дані в об'єкт
        let products;
        try {
          products = JSON.parse(data);
        } catch (parseError) {
          console.log(parseError);
          return res.status(400).send("Некоректний формат JSON");
        }

        // Зберігаємо дані до MongoDB
        Product.insertMany(products)
          .then(() => {
            // Видалити завантажений файл після обробки
            fs.unlink(filePath, (unlinkErr) => {
              if (unlinkErr) {
                console.log(unlinkErr);
              }
            });

            res.status(200).send("Дані успішно завантажено до бази даних");
          })
          .catch((dbError) => {
            console.log(dbError);
            res.status(500).send("Помилка бази даних під час збереження даних");
          });
      });
    })
    .catch((dbError) => {
      console.log(dbError);
      res
        .status(500)
        .send("Помилка бази даних під час очищення попередніх даних");
    });
});
