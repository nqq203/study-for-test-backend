const jwt = require("jsonwebtoken");
const moment = require("moment");
const sessionConstant = require("../constants/session.constant");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types
const User = require("../models/users");
const Session = require("../models/sessions");
const Order = require("../models/orders");
const {
  AuthFailureResponse,
  ForbiddenResponse,
  InternalServerError,
} = require("../common/error.response");
const _ = require("lodash");
const { UNAUTHORIZED } = require("../utils/reasonPhrases");

const verifyToken = async (req, res, next) => {
  try {
    // console.log(req.headers);
    const token = req.headers["authorization"]?.split(" ")[1];
    console.log(token);

    if (!token) {
      return res.send(new AuthFailureResponse("Bạn cần phải đăng nhập").responseBody());
    }
    let verified;
    try {      
      const {sessionId, userId} = jwt.verify(token, process.env.JWT_SECRET_KEY)
      
      const session = await Session.findById(sessionId);
      
      if (!session) {
        return res.send(new AuthFailureResponse("Bạn cần phải đăng nhập").responseBody());
      }
      if (session && session.expiredAt < moment()) {
        return res.send(new AuthFailureResponse("Bạn cần phải đăng nhập").responseBody());
      }
      if (session.status !== sessionConstant.STATUS_TOKEN.ACTIVE) {
        return res.send(new AuthFailureResponse("Bạn cần phải đăng nhập").responseBody());
      }
      if (session && String(session.userId) !== userId) {
        return res.send(new AuthFailureResponse("Bạn cần phải đăng nhập").responseBody());
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.send(new AuthFailureResponse("Bạn cần phải đăng nhập").responseBody());
      }
      // req.session = session;
      req.user = user;

      next();
    } catch (err) {
      console.log(err)
      res.send(new AuthFailureResponse("Bạn cần phải đăng nhập").responseBody());
    }

  } catch (err) {
    res.send(new InternalServerError('Internal server error'));
  }
};

const checkRoles = (roles) => {
  return (req, res, next) => {
    const { user } = req; //req.user

    if (roles.indexOf(user.role) !== -1) {
      next();
    } else {
      console.log("Forbidden");
      res.send(new ForbiddenResponse('Forbidden').responseBody());
    }
  };
};

const checkCourseAccess = async (req,res,next) => {
  const courseId = req.query.courseId
  const {user} = req;
  let isAccessible = false

  try{
    if(user.role === "LEARNER"){
      // check if learner registers this course?, status = COMPLETED
      const userOrders = await Order.find({
        $and: [
            {userId: user._id},
            {status: "COMPLETED"}
        ]
      })
      // console.log(userOrders)

      userOrders.forEach( order => {
        const {items} = order
        items.forEach(item => {
          const itemCourseId = item?.itemId?.toString()
          if(itemCourseId === courseId){
            console.log("Valid")
            isAccessible = true
          }
        })
      })

      if(isAccessible === false){
        return res.send(new AuthFailureResponse('Unregistered course').responseBody())
      }

    }

    if(user.role === "PROVIDER"){
      // check if course is created by this provider
    }

    next()
  } catch(error) {
    console.log("Error checking course access:", error);
    return res.send(new InternalServerError('Internal server error'))
  }
}

module.exports = {
  verifyToken,
  checkRoles,
  checkCourseAccess,
};