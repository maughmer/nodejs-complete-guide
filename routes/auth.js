const express = require('express');

// https://express-validator.github.io/docs
// https://github.com/validatorjs/validator.js
const { body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login',
  [ // validators
    body('email').isEmail().normalizeEmail()
      .withMessage('Please enter a valid email.'),
    body('password').trim().isLength({ min: 3 })
  ],
  authController.postLogin
);

router.post('/signup',
  [ // validators
    body('email').isEmail().normalizeEmail()
      .withMessage('Please enter a valid email.')
      .custom((value, { req }) => {
        // if (value === 'test@test.com') {
        //   throw new Error('This email address is forbidden.');
        // }
        // return true;
        return User.findOne({ email: value })
          .then(foundUser => {
            if (foundUser) {
              return Promise.reject('Email already in use.');
            }
          })
      }),
    body('password').trim().isLength({ min: 3 }),
    body('confirmPassword').trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords must match.');
        }
        return true;
      })
  ],
  authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/new-password/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
