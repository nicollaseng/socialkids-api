class UnauthorizedError extends Error {
  constructor(code, error) {
    super(error.message);

    this.name = 'UnauthorizedError';
    this.message = error.message;
    this.code = code;
    this.status = 401;
    this.inner = error;

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(this.message)).stack;
    }
  }
}

module.exports = {
  UnauthorizedError
};
