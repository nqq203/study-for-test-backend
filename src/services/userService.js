const UserRepository = require('../repositories/userRepository');
const SessionRepository = require('../repositories/sessionRepository');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const moment = require("moment");
require('dotenv').config();
const {
  ConflictResponse,
  BadRequest,
  InternalServerError,
  NotFoundResponse,
} = require("../common/error.response");
const {
  CreatedResponse,
  SuccessResponse,
} = require("../common/success.response");

module.exports = class UserService {
  constructor() {
    this.repository = new UserRepository();
    this.sessionRepo = new SessionRepository();
  }

  async signUp({fullName, email, password}) {
    console.log({fullName, email, password})
    if (!fullName || !email || !password) {
      return new BadRequest("Missed information");
    }

    const existingUser = await this.repository.getByEntity({email: email});
    
    if (existingUser) {
      return new BadRequest("User already exists!")
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await this.repository.create({fullName, email, password: hashedPassword, userType: "normal"});

    if (!newUser) {
      return new InternalServerError("Can not create user!");
    }

    return new CreatedResponse({
      success: true,
      message: "User registered successfully",
      code: 200,
    });
  }

  async signIn({email, password}) {
    const user = await this.repository.getByEntity({ email });
    if (!user) {
      return new NotFoundResponse("User not found!");
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return new BadRequest("Invalid password!");
    }

    const currentSession = await this.sessionRepo.getByEntity({
      userId: user.userId,
      status: 'ACTIVE',
      logoutAt: null,
    });

    if (currentSession) {
      const updateSession = await this.sessionRepo.update({ 
        sessionId: currentSession.sessionId,
        status: 'INACTIVE', 
        logoutAt: moment().toString()
      });

      if (!updateSession) {
        return new InternalServerError("Login failed!");
      }
    }

    const session = await this.sessionRepo.create({
      status: 'ACTIVE',
      userId: user.userId,
      logoutAt: null
    })

    console.log(session);
    console.log(user.userId);
    const u = await this.repository.getByEntity({userId: user.userId});
    const token = jwt.sign({sessionId: session.sessionId, userId: user.userId, userType: u.userType}, process.env.JWT_SECRET_KEY);

    return new SuccessResponse({
      success: true,
      message: "Login successful",
      code: 200,
      metadata: { token: token },
    });
  }

  async signOut({ token }) {
    const data = jwt.decode(token, process.env.JWT_SECRET_KEY);
    console.log(data);
    console.log(moment().toString());
    const logoutTime = moment().toString();
    const session = await this.sessionRepo.update({ sessionId: data.sessionId, status: 'INACTIVE', logoutAt: logoutTime, userId: data.userId});
    if (!session) {
      return new InternalServerError("Logout failed!");
    }
    return new SuccessResponse({
      success: true,
      message: "Logout successfully!",
      code: 200,
    });
  }
  
  async signInWithOauth(data) {
    console.log(data);
    const user = await this.repository.getByEntity({ email: data.email });
    if (!user) {
      return new NotFoundResponse("User not found!");
    }

    const currentSession = await this.sessionRepo.getByEntity({
      userId: user.userId,
      status: 'ACTIVE',
      logoutAt: null,
    });

    if (currentSession) {
      const updateSession = await this.sessionRepo.update({ 
        sessionId: currentSession.sessionId,
        status: 'INACTIVE', 
        logoutAt: moment().toString()
      });

      if (!updateSession) {
        return new InternalServerError("Login failed!");
      }
    }

    const session = await this.sessionRepo.create({
      status: 'ACTIVE',
      userId: user.userId,
      logoutAt: null
    })

    const token = jwt.sign({sessionId: session.sessionId, userId: user.userId}, process.env.JWT_SECRET_KEY);

    const { password, ...userInfo} = user;
    return new SuccessResponse({
      success: true,
      message: "Login successful",
      code: 200,
      metadata: { 
        token: token,
        userInfo: userInfo
      },
    });
  }

  async findOrCreateOauthUser(profile) {
    // console.log(profile);
    const email = profile.emails[0].value;
    let user = await this.repository.getByEntity({ email: email });
    if (user) {
      return user;
    } else {
      const newUser = {
        fullName: profile.displayName,
        email: email,
        password: process.env.OAUTH_RANDOM_KEY,
        userType: "normal",
      };
      const data = await this.repository.create(newUser);
      return data;
    }
  }

  async getUserById({id}) {
    const user = await this.repository.getByEntity({userId: id});
    if (!user) {
      return new NotFoundResponse("User not found");
    }
    return new SuccessResponse({ message: "User found", metadata: user });
  }

  async getUserInfo({userId}) {
    const user = await this.repository.getByEntity({userId: userId});
    if (!user) {
      return new NotFoundResponse("User not found");
    }
    const { password, ...userInfo } = user;
    return new SuccessResponse({
      success: true,
      message: "User found",
      code: 200,
      metadata: userInfo
    });
  }
}