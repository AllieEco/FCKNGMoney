module.exports = (req, res) => {
  res.json({
    message: 'Hello from FCKNGMoney API!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
}; 