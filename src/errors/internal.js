class InternalError extends Error {
  constructor(code, error) {
    super(error.message);

    this.name = 'InternalError';
    this.message = error.message;
    this.code = code;
    this.status = 500;
    this.inner = error;

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(this.message)).stack;
    }
  }
}

module.exports = {
  InternalError
};
