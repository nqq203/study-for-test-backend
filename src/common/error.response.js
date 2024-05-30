const { ReasonPhrases, StatusCodes } = require('../utils/httpStatus');

class ErrorResponse extends Error {
    constructor(
        message = ReasonPhrases.INTERNAL_SERVER_ERROR,
        code = StatusCodes.INTERNAL_SERVER_ERROR,
        errors = null,
    ) {
        super(message);
        this.success = false;
        this.code = code;
        this.errors = errors;
    }
    responseBody() {
        // console.log(this);
        return {
          success: this.success,
          code: this.code,
          message: this.message,
          data: this.data,
        };
      }
}

class ForbiddenResponse extends ErrorResponse {
    constructor(message = ReasonPhrases.FORBIDDEN, code = StatusCodes.FORBIDDEN) {
        super(message, code);
    }
}

class ConflictResponse extends ErrorResponse {
    constructor(message = ReasonPhrases.CONFLICT, code = StatusCodes.CONFLICT) {
        super(message, code);
    }
}

class AuthFailureResponse extends ErrorResponse {
    constructor(message = ReasonPhrases.UNAUTHORIZED, code = StatusCodes.UNAUTHORIZED) {
        super(message, code);
    }
}

class NotFoundResponse extends ErrorResponse {
    constructor(message = ReasonPhrases.NOT_FOUND, code = StatusCodes.NOT_FOUND) {
        super(message, code);
    }
}

class BadRequest extends ErrorResponse {
  constructor(message = ReasonPhrases.BAD_REQUEST, code = StatusCodes.BAD_REQUEST) {
    super(message, code)
  }
}

class UnprocessableContentResponse extends ErrorResponse {
    constructor(errors = [], message = ReasonPhrases.UNPROCESSABLE_ENTITY, code = StatusCodes.UNPROCESSABLE_ENTITY) {
        super(message, code, errors);
    }
}
class InternalServerError extends ErrorResponse {
    constructor(message = ReasonPhrases.INTERNAL_SERVER_ERROR, code = StatusCodes.INTERNAL_SERVER_ERROR) {
        super(message, code);
    }
}

module.exports = {
  ErrorResponse,
  ForbiddenResponse,
  ConflictResponse,
  AuthFailureResponse,
  NotFoundResponse,
  BadRequest,
  UnprocessableContentResponse,
  InternalServerError
}