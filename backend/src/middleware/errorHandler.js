// Centralized error handler. Every controller uses try/catch and calls next(err)
// on failure so all errors funnel through here with a consistent JSON shape.
const errorHandler = (err, req, res, next) => {
  console.error(err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

const notFound = (req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

module.exports = { errorHandler, notFound };