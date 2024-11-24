const express = require('express');

// https://express-validator.github.io/docs
// https://github.com/validatorjs/validator.js
const { body } = require('express-validator');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/add-product', isAuth, adminController.getAddProduct);

router.get('/products', isAuth, adminController.getProducts);

router.post('/add-product',
  [ // validators
    body('title').trim().isLength({ min: 3 }),
    // body('imageUrl').trim().isURL()
    //   .withMessage('Image URL should contain an URL.'),
    body('price').isCurrency()
      .withMessage('Price must contain a number.'),
    body('description').trim().isLength({ min: 5, max: 400 })
  ],
  isAuth,
  adminController.postAddProduct
);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product',
  [ // validators
    body('title').trim().isLength({ min: 3 }),
    // body('imageUrl').trim().isURL()
    //   .withMessage('Image URL should contain an URL.'),
    body('price').isCurrency()
      .withMessage('Price must contain a number.'),
    body('description').trim().isLength({ min: 5, max: 400 })
  ],
  isAuth,
  adminController.postEditProduct
);

// client-side deletion to avoid page reloads
router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;
