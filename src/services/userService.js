const UserRepository = require('../repositories/userRepository');
const SessionRepository = require('../repositories/sessionRepository');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const moment = require("moment");
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
    const newUser = await this.repository.create({fullName, email, password: hashedPassword});

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

    const token = jwt.sign({sessionId: session.sessionId, userId: user.userId}, process.env.JWT_SECRET_KEY);

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
}