const { ReasonPhrases, StatusCodes } = require("../utils/httpStatus")
const pick = require("../utils/pick")

class SuccessResponse {
  constructor({ message = ReasonPhrases.OK, code = StatusCodes.OK, metadata = {} }) {
    this.payload = {
      success: true,
      message,
      code,
      metadata
    }
  }
  responseBody() {
    return this.payload
  }
  send({ req, res, header = {}, cookies = {} }) {
    // Handle cookie
    Object.entries(cookies).forEach(([key, value]) => {
      if(value) {
        res.cookie(key, value)
      } else {
        res.clearCookie(key)
      }
    })
    __logger.info(this.payload.message, { ...pick(req, ["ip", "originalUrl", "method", "params", "body"]), status: this.payload.code })
    return res.status(this.payload.code).json(this.payload)
  }
} 

class CreatedResponse extends SuccessResponse {
  constructor({ message = ReasonPhrases.CREATED, code = StatusCodes.CREATED, metadata = {} }) {
    super({ message, code, metadata })
  }
}

module.exports = { 
  SuccessResponse,
  CreatedResponse
}