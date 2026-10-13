/**
 * Error handling is centralised here so every route returns the same JSON shape:
 *   { "error": { "message": "...", "status": 404 } }
 */

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function notFoundHandler(req, res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Express recognises error handlers by their four arguments, so `next` must stay.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Malformed JSON bodies are reported by express.json() as status 400.
  const status = err.status || err.statusCode || 500;
  const isDeliberate = err instanceof HttpError;
  const isUnexpectedServerError = status >= 500 && !isDeliberate;

  if (isUnexpectedServerError) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  }

  res.status(status).json({
    error: {
      status,
      code: err.code,
      // Messages written on purpose (HttpError) and client errors (4xx) are safe to show.
      // Anything else that failed with a 5xx could contain internals, so it is hidden from clients.
      message: isUnexpectedServerError ? 'Internal server error' : err.message,
    },
  });
}

module.exports = { HttpError, notFoundHandler, errorHandler };
