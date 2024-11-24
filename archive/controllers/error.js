exports.get404 = (req, res, next) => {
  // res.status(404).send('<h1>Page not found</h1>');
  // res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
  //
  // pug & handlebars
  // res.status(404).render('404', { pageTitle: 'Page Not Found' });
  //
  // ejs
  // 'path: null' needed here, or path will be undefined in nav.ejs
  res.status(404).render('404', { pageTitle: 'Page Not Found', path: null });
};
