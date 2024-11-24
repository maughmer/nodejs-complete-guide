const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  // the purpose of the userId is to log who added the product
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// Product will become a collection named products
module.exports = mongoose.model('Product', productSchema);
