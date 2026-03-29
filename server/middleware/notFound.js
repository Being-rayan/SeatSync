function notFound(_req, res) {
  res.status(404).json({
    error: {
      message: "Resource not found.",
      details: null
    }
  });
}

module.exports = notFound;
