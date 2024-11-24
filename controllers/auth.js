const crypto = require('crypto');

const bcrypt = require('bcryptjs');
// const nodemailer = require('nodemailer');

const { validationResult } = require('express-validator');

const User = require('../models/user');
const user = require('../models/user');

// https://nodemailer.com/smtp/
// const transporter = nodemailer.createTransport({
//   host: 'xxx',
//   port: xxx,
//   secure: false,
//   auth: {
//     user: 'xxx',
//     pass: 'xxx'
//   }
// });

exports.getLogin = (req, res, next) => {
  const message = req.flash('error');
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message.length > 0 ? message[0] : '',
    oldInput: { email: '', password: '' },
    validationErrors: []
  });      
};

exports.getSignup = (req, res, next) => {
  const message = req.flash('error');
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message.length > 0 ? message[0] : '',
    oldInput: { email: '', password: '', customPassword: '' },
    validationErrors: []
  });
};

exports.postLogin = (req, res, next) => {
  // TODO: validate
  const email = req.body.email;
  const password = req.body.password;
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      oldInput: { email, password },
      validationErrors: errors.array()
    });
  }

  User.findOne({ email })
    .then(user => {
      if (!user) {
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Invalid email or password.', 
          oldInput: { email, password },
          validationErrors: []
        });
      }
      bcrypt.compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              if (err) {
                console.log(err);
              }
              // TODO: validate
              return res.redirect('/');
            });
          }
          return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: 'Invalid email or password.', 
            oldInput: { email, password },
            validationErrors: []
          });
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login');
        });
    })
    .catch(err => {
      // res.redirect('/500');
      const error = new Error(err, { httpStatusCode: 500 });
      return next(error);
    });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: { email, password, confirmPassword: req.body.confirmPassword },
      validationErrors: errors.array()
    });
  }

  bcrypt.hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        email,
        password: hashedPassword,
        cart: { items: [] }
      });
      return user.save();
    })
    .then(result => {
      res.redirect('/login');
      // return transporter.sendMail({
      //   to: email,
      //   from: 'xxx',
      //   subject: 'Signup succeeded!',
      //   html: '<h1>You successfully signed up!</h1>'
      // });
    })
    .catch(err => {
      // res.redirect('/500');
      const error = new Error(err, { httpStatusCode: 500 });
      return next(error);
    });
  };

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    if (err) {
      console.log(err);
    }
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  const error = req.flash('error');
  const info = req.flash('info');
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: error.length > 0 ? error[0] : '',
    infoMessage: info.length > 0 ? info[0] : ''
  });
};

exports.postReset = (req, res, next) => {
  if (!req.body.email) {
    req.flash('error', 'Please enter your email.');
    return res.redirect('/reset');
  }
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log('postReset:', err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          req.flash('error', 'No account with that email found.');
          return res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 600000; // 10 minutes in millis
        return user.save();
      })
      .then(result => {
        req.flash('info', 'A password reset request has been sent to your email.');
        // I'm not actually performing this op using email, so we'll just redirect
        return res.redirect(`/new-password/${token}`);
        // res.redirect('/');
        // transporter.sendMail({
        //   to: req.body.email,
        //   from: 'xxx',
        //   subject: 'Paassword reset!',
        //   html: `
        //     <p>You requested a password reset</p>
        //     <p>Click this <a href="http://localhost:3000/reset/${token}>link</a> to set a new password.</p>
        //     <p>The link will be valid for 10 minutes.</p>
        //   `
        // });
      })
      .catch(err => {
        // res.redirect('/500');
        const error = new Error(err, { httpStatusCode: 500 });
        return next(error);
      });
    });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() }})
    .then(user => {
      const message = req.flash('error');
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message.length > 0 ? message[0] : '',
        userId: user._id.toString(),
        token
      });
    })
    .catch(err => {
      // res.redirect('/500');
      const error = new Error(err, { httpStatusCode: 500 });
      return next(error);
    });
};

exports.postNewPassword = (req, res, next) => {
  // TODO: validate
  let resetUser;
  const token = req.body.token;
  const userId = req.body.userId;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  if (password !== confirmPassword) {
    req.flash('error', "Passwords don't match.");
    return res.redirect('/signup');
  }
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId
  })
    .then(user => {
      resetUser = user;
      return bcrypt.hash(password, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(result => {
      res.redirect('/');
    })
    .catch(err => {
      // res.redirect('/500');
      const error = new Error(err, { httpStatusCode: 500 });
      return next(error);
    });
};
