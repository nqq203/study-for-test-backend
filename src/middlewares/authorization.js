const jwt = require("jsonwebtoken");
const moment = require("moment");
const {
  AuthFailureResponse,
  ForbiddenResponse,
  InternalServerError,
} = require("../common/error.response");
const _ = require("lodash");
const { UNAUTHORIZED } = require("../utils/reasonPhrases");
const SessionRepository = require("../repositories/sessionRepository");
const UserRepository = require("../repositories/userRepository");

const verifyToken = async (req, res, next) => {
  try {
    // console.log(req.headers);
    const token = req.headers["authorization"]?.split(" ")[1];
    console.log(token);
    if (!token) {
      return res.send(new AuthFailureResponse("You need to log in").responseBody());
    }

    try {      
      const {sessionId, userId} = jwt.verify(token, process.env.JWT_SECRET_KEY)
      const sessionRepo = new SessionRepository();
      const session = await sessionRepo.getByEntity({sessionId: sessionId});
      
      if (!session) {
        return res.send(new AuthFailureResponse("You need to log in").responseBody());
      }

      if (session.status !== "ACTIVE") {
        return res.send(new AuthFailureResponse("You need to log in").responseBody());
      }

      if (session && session.userId !== userId) {
        return res.send(new AuthFailureResponse("You need to log in").responseBody());
      }
      
      const userRepo = new UserRepository();
      const user = await userRepo.getByEntity({userId: userId});
      if (!user) {
        return res.send(new AuthFailureResponse("You need to log in").responseBody());
      }

      // req.session = session;
      req.user = user;

      next();
    } catch (err) {
      console.log(err)
      res.send(new AuthFailureResponse("You need to log in").responseBody());
    }

  } catch (err) {
    res.send(new InternalServerError('Internal server error'));
  }
};

const checkRoles = (req, res, next) => {
  const { user } = req; //req.user
  console.log(user);

  if (user && user.userType === 'admin') {
    next(); // Người dùng là admin, tiếp tục xử lý tiếp theo
  } else { 
      console.log("Forbidden");
      res.send(new ForbiddenResponse('Forbidden').responseBody());
  };
};

module.exports = {
  verifyToken,
  checkRoles,
};