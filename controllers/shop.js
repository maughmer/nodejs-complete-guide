const fs = require('fs');
const path = require('path');
const stripe = require('stripe')('api-key here');

const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;
  
  Product.find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
      res.render('shop/product-list', {
        products,
        pageTitle: 'All Products',
        path: '/products',
        // pagination
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPrevPage: page > 1,
        nextPage: page + 1,
        prevPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      // res.redirect('/500');
      const error = new Error(err, { httpStatusCode: 500 });
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product,
        pageTitle: product.title,
        path: '/products'
      })
    })
    .catch(err => {
      // res.redirect('/500');
      const error = new Error(err, { httpStatusCode: 500 });
      return next(error);
    });
};

// TODO: note pagination code in getProducts is replicated here
exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
      res.render('shop/index', {
        products,
        pageTitle: 'Shop',
        path: '/',
        // pagination
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPrevPage: page > 1,
        nextPage: page + 1,
        prevPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      })
    })
    .catch(err => {
      // res.redirect('/500');
      const error = new Error(err, { httpStatusCode: 500 });
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
      });
    })
    .catch(err => {
      // res.redirect('/500');
      const error = new Error(err, { httpStatusCode: 500 });
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(() => {
      res.redirect('/cart');
    })
    .catch(err => {
      // res.redirect('/500');
      const error = new Error(err, { httpStatusCode: 500 });
      return next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user.removeFromCart(prodId)
    .then(() => {
      res.redirect('/cart');
    })
    .catch(err => {
      // res.redirect('/500');
      const error = new Error(err, { httpStatusCode: 500 });
      return next(error);
    });
};

exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;
  req.user
    .populate('cart.items.productId')
    .then(user => {
      products = user.cart.items;
      total = 0;
      products.forEach(p => {
        total += p.quantity * p.productId.price;
      });

      // disabling because demo only; i don't have a stripe api acct
      // return stripe.checkout.sessions.create({
      //   payment_method_types: ['card'],
      //   line_items: products.map(p => {
      //     return {
      //       name: p.productId.title,
      //       description: p.productId.description,
      //       amount: p.productId.price * 100,
      //       currency: 'usd',
      //       quantity: p.quantity
      //     };
      //   }),
      //   success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
      //   cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
      // });
    })
    .then(session => {
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        products: products,
        totalSum: total,
        sessionId: session.id
      });
    })
    .catch(err => {
      // res.redirect('/500');
      const error = new Error(err, { httpStatusCode: 500 });
      return next(error);
    });
};

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then(user => {
      console.log(user.cart.items);
      const products = user.cart.items.map(item => {
        return { quantity: item.quantity, product: { ...item.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products
      });
      return order.save();
    })
    .then(() => {
      return req.user.clearCart();
    })
    .then(() => {
       res.redirect('/orders');
    })
    .catch(err => {
      // res.redirect('/500');
      const error = new Error(err, { httpStatusCode: 500 });
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders
      });      
    })
    .catch(err => {
      // res.redirect('/500');
      const error = new Error(err, { httpStatusCode: 500 });
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then(order => {
      if (!order) {
        return next(new Error('No order found.'));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error('Unauthorized'));
      }
      const invoiceName = 'Invoice-' + orderId + '.pdf';
      const invoicePath = path.join('data', 'invoices', invoiceName);

      // read and send a file...
      //
      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     return next(err);
      //   }
      //   res.setHeader('Content-Type', 'application/pdf');
      //   res.setHeader('Content-Disposition', `inline; filename="${invoiceName}"`);
      //   res.send(data);
      // });

      // stream a file...
      //
      // const file = fs.createReadStream(invoicePath);
      // file.on('error', err => next(err));
      // file.on('open', () => {
      //   res.setHeader('Content-Type', 'application/pdf');
      //   res.setHeader('Content-Disposition', `inline; filename="${invoiceName}"`);
      //   file.pipe(res);
      // });

      // alternate approach to streaming a file...
      //
      // const options = {
      //   root: '.',
      //   headers: {
      //     'Content-Type': 'application/pdf',
      //     'Content-Disposition': `attachment; filename="${invoiceName}"`
      //   }
      // };
      // res.sendFile(invoicePath, options, err => {
      //   if (err) {
      //     next(err);
      //   }
      // });

      // generate a pdf, rather than use a static file...
      //
      const pdfDoc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${invoiceName}"`);
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(20).text('Invoice', { underline: true });
      pdfDoc.fontSize(12).moveDown();
      let totalPrice = 0;
      order.products.forEach(prod => {
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc.text(prod.product.title + ' - ' + prod.quantity + ' x $' + prod.product.price);
      });
      totalPrice = 'Total price: $' + totalPrice;
      pdfDoc.moveDown().moveTo(pdfDoc.x, pdfDoc.y).lineTo(pdfDoc.x + pdfDoc.widthOfString(totalPrice), pdfDoc.y).stroke();
      pdfDoc.moveDown(0.5);
      pdfDoc.text(totalPrice);

      pdfDoc.end();
    })
    .catch(err => next(err));
};
