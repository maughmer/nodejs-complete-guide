const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
// handlebars
// const { engine } = require('express-handlebars');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

const errorController = require('./controllers/error');

const app = express();

// pug
// https://pugjs.org/api/getting-started.html
// app.set('view engine', 'pug');
// app.set('views', 'views'); // not really needed, since views is the default
//
// handlebars
// https://handlebarsjs.com/
// extname required when using layouts
// view/layouts is the default for layoutsDir
// main is the default for defaultLayout
// app.engine('hbs', engine({ extname: 'hbs', layoutsDir: 'views/layouts', defaultLayout: 'main-layout' }));
// app.set('view engine', 'hbs');
//
// ejs
// http://ejs.co/#docs
// unlike pug and handlebars, ejs doesn't support layouts. instead we use includes.
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// don't need this, so stop node from querying it
app.get('/favicon.ico', (req, res) => res.status(204));

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

app.listen(3000);
