const fileHelper = require('../util/file');

const { validationResult } = require('express-validator');

const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    // editing: false,
    product: null,
    errorMessage: null,
    validationErrors: []
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = parseFloat(req.body.price);
  const description = req.body.description;
  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      // editing: false,
      product: { title, price, description },
      errorMessage: 'Attached file is not an image.',
      validationErrors: []
    });
  }

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      // editing: false,
      product: { title, price, description },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  const imageUrl = image.path;

  // could also use specify req.user, and mongoose will use the _id,
  // since it's expects and ObjectId
  const product = new Product({
    title, price, description, imageUrl, userId: req.user
  });
  // product.userId = req.user._id;
  product.save()
    .then(result => res.redirect('/admin/products'))
    .catch(err => {
      // res.status(500).render('admin/edit-product', {
      //   pageTitle: 'Add Product',
      //   path: '/admin/add-product',
      //   // editing: false,
      //   product: { title, imageUrl, price, description },
      //   errorMessage: 'Database operation failed, please try again.',
      //   validationErrors: []
      // });
      // res.redirect('/500');
      const error = new Error(err, { httpStatusCode: 500 });
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  // don't need editMode, as Max is doing, can just test for product
  // const editMode = req.query.edit;
  // if (!editMode) {
  //   return res.redirect('/');
  // }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        // editing: editMode,
        product,
        errorMessage: null,
        validationErrors: []
      });
    })
    .catch(err => {
      // res.redirect('/500');
      const error = new Error(err, { httpStatusCode: 500 });
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = parseFloat(req.body.price);
  const description = req.body.description;
  const prodId = req.body.productId;
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      // editing: false,
      product: { title, price, description, _id: prodId },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  Product.findById(prodId)
    .then(product => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/');
      }
      product.title = title;
      product.price = price;
      product.description = description;
      if (image) {
        fileHelper.deleteFile(product.imageUrl); // don't care about result
        product.imageUrl = image.path;
      }
      return product.save()
        .then(result => res.redirect('/admin/products'))
    })
    .catch(err => {
      // res.redirect('/500');
      const error = new Error(err, { httpStatusCode: 500 });
      return next(error);
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    // example: select the title and price, but not the _id
    // .select('title price -_id')
    // example: query and return the related userId and name
    // .populate('userId', 'name')
    .then(products => {
      res.render('admin/products', {
        products: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });      
    })
    .catch(err => {
      // res.redirect('/500');
      const error = new Error(err, { httpStatusCode: 500 });
      return next(error);
    });
};

// client-side deletion to avoid page reloads
exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return next(new Error('Product not found.'));
      }
      fileHelper.deleteFile(product.imageUrl); // don't care about result
      return Product.deleteOne({ _id: prodId, userId: req.user._id });
    })
    .then(result => {
      res.status(200).json({ message: 'Success!' });
    })
    .catch(err => {
      res.status(500).json({ message: 'Deleting product failed.' });
    });
};
