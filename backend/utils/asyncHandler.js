/**
 * Wrapper utility to catch errors in async route handlers
 * and pass them to Express error handler
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Only pass to error handler if next is a function
      if (typeof next === 'function') {
        next(error);
      } else {
        // If next is not available, send error response directly
        if (!res.headersSent) {
          res.status(500).json({ message: error.message || 'Internal server error' });
        }
      }
    });
  };
};

module.exports = asyncHandler;

