const path = require("path");
const fs = require("fs");

const { validationResult } = require("express-validator");

const Item = require("../models/item");
const Seller = require("../models/seller");
const Account = require("../models/account");

exports.createItem = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed, Incorrect data entered.");
    error.statusCode = 422;
    error.errors = errors.array();
    throw error;
  }
  if (req.files.length <= 0) {
    const error = new Error("Upload an image as well.");
    error.statusCode = 422;
    throw error;
  }
  let arrayFiles = [];

  arrayFiles = req.files.map(pic => {
    return pic.path;
  });

  const title = req.body.title;
  const fooditems = req.body.fooditems;
  const price = req.body.price;
  const tags = req.body.tags;
  const description = req.body.description;
  let creator;

  Account.findById(req.loggedInUserId)
    .then(account => {
      return Seller.findOne({ account: account._id });
    })
    .then(seller => {
      creator = seller;

      const item = new Item({
        title: title,
        fooditems: Array.isArray(fooditems)
          ? fooditems
          : fooditems.split(",").map(fooditem => " " + fooditem.trim()),
        imageUrl: arrayFiles,
        description: description,
        price: price,
        tags: tags,
        creator: creator._id
      });

      item
        .save()
        .then(savedItem => {
          seller.items.push(item);
          return seller.save();
        })
        .then(updatedSeller => {
          res.status(201).json({
            message: "Item created, hurray!",
            item: item,
            files:req.files,
            creator: { _id: creator._id, name: creator.name }
          });
        });
    })
    .catch(err => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
};

exports.deleteItem = (req, res, next) => {
  const itemId = req.params.itemId;
  Item.findById(itemId)
    .then(item => {
      if (!item) {
        const error = new Error(
          "Could not find any Item with the given itemId"
        );
        error.statusCode = 404;
        throw error;
      }
      clearImage(item.imageUrl);

      return Item.findByIdAndRemove(itemId);
    })
    .then(deletedItem => {
      return Account.findById(req.loggedInUserId);
    })
    .then(account => {
      return Seller.findOne({ account: account._id });
    })
    .then(seller => {
      seller.items.pull(itemId);
      return seller.save();
    })
    .then(result => {
      res.status(200).json({
        message: "Item deleted successfully."
      });
    })
    .catch(err => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
};

exports.editItem = (req, res, next) => {
  const itemId = req.params.itemId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed, Incorrect data entered.");
    error.statusCode = 422;
    error.errors = errors.array();
    throw error;
  }

  let arrayFiles = [];

  arrayFiles = req.files.map(pic => {
    return pic.location;
  });

  const title = req.body.title;
  const fooditems = req.body.fooditems;
  const price = req.body.price;
  const tags = req.body.tags;
  const description = req.body.description;
  const imageUrl = [...arrayFiles];

  Item.findById(itemId)
    .then(fetchedItem => {
      console.log("fetched item", fetchedItem);
      if (!fetchedItem) {
        const error = new Error(
          "Could not find any Item with the given itemId"
        );
        error.statusCode = 404;
        throw error;
      }
      console.log({ imageUrl, fetchedItem });
      console.log("imgurl", imageUrl.length);
      if (imageUrl.length !== 0) {
        let difference = fetchedItem.imageUrl.filter(
          x => !imageUrl.includes(x)
        );

        difference && clearImage(difference);
      }

      fetchedItem.title = title;
      fetchedItem.description = description;
      fetchedItem.fooditems = fooditems;

      fetchedItem.price = price;
      fetchedItem.tags = tags;
      if (imageUrl.length !== 0) {
        fetchedItem.imageUrl = imageUrl;
      } else {
        fetchedItem.imageUrl;
      }

      return fetchedItem.save();
    })
    .then(updatedItem => {
      res.status(200).json({
        message: "Item updated",
        item: updatedItem,
        files:req.files
      });
    })
    .catch(err => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
};

exports.getItems = (req, res, next) => {
  Account.findById(req.loggedInUserId)
    .then(account => {
      return Seller.findOne({ account: account._id });
    })
    .then(seller => {
      return Item.find({ _id: { $in: seller.items } });
    })
    .then(items => {
      res.json({ items: items });
    })
    .catch(err => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
};

exports.getItem = (req, res, next) => {
  const itemId = req.params.itemId;
  Item.findById(itemId)
    .then(item => {
      if (!item) {
        const error = new Error(
          "Could not find any Item with the given itemId"
        );
        error.statusCode = 404;
        throw error;
      }
      res
        .status(200)
        .json({ message: "Item fetched successfully", item: item });
    })
    .catch(err => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
};

const clearImage = filepath => {
  console.log("file path", filepath);
  for (let file_path of filepath) {
    console.log("file_path", file_path);
    //console.log("file_path 222",filepath[file_path]);
    filepath = path.join(__dirname, "../", file_path);
    console.log("file_path 2", filepath);

    fs.unlink(filepath, err => {
      console.log(err);
    });
  }
};
