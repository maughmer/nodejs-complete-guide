const Product = require('../models/product');

exports.getProducts = (req, res, next) => {
  // const products = Product.fetchAll();

  // res.sendFile(path.join(rootDir, 'views', 'shop.html'));
  //
  // pug
  // res.render('shop', { prods: products, pageTitle: 'Shop', path: '/' });
  //
  // handlebars
  // res.render('shop', { prods: products, pageTitle: 'Shop', path: '/',
  //   hasProducts: products.length > 0, productCSS: true, activeShop: true
  // });
  //
  // ejs
  // res.render('shop', { prods: products, pageTitle: 'Shop', path: '/' });
  Product.fetchAll((products) => {
    res.render('shop', { prods: products, pageTitle: 'Shop', path: '/' });
  });
};

exports.getAddProduct = (req, res, next) => {
  // res.send(`
  //   <form action="${req.baseUrl}/add-product" method="POST">
  //     <input type="text" name="title">
  //     <button type="submit">Add Product</button>
  //   </form>
  // `);
  // res.sendFile(path.join(rootDir, 'views', 'add-product.html'));
  //
  // pug
  // res.render('add-product', { pageTitle: 'Add Product', path: '/admin/add-product' });
  //
  // handlebars
  // res.render('add-product', { pageTitle: 'Add Product', path: '/admin/add-product',
  //   formsCSS: true, productCSS: true, activeAddProduct: true
  // });
  //
  // ejs
  res.render('add-product', { pageTitle: 'Add Product', path: '/admin/add-product' });
};

exports.postAddProduct = (req, res, next) => {
  // products.push({ title: req.body.title });
  const product = new Product(req.body.title);
  product.save();

  res.redirect('/');
};
