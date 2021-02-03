const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const itemSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    fooditems: {
      type: [String]
      // required: true
    },
    description: {
      type: String,
      required: true
    },
    tags: {
      type: String
    },
    imageUrl: [
      {
        img: {
          type: String,
          required: true
        },
        imgKey: {
          type: String,
          required: true
        }
      }
    ],
    price: {
      type: Number,
      required: true
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Item", itemSchema);
