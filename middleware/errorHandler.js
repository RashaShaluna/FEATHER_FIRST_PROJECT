const handle404 = (req, res, next) => {
  res.status(404).redirect('/pageNotFound');
};

const handle500 = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).redirect('/serverError');
};

module.exports = { handle404, handle500 };
