const express = require('express');
const UserService = require('../services/userService');
const service = new UserService();
const userRouter = express.Router();
const passport = require("../configs/passsport.config");
require('dotenv').config();
const { verifyToken } = require('../middlewares/authorization');
const {
  CreatedResponse, 
  SuccessResponse,
} = require('../common/success.response');

userRouter.post('/signin', async (req, res) => {
  const data = req.body;
  const response = await service.signIn(data);
  if (response instanceof SuccessResponse) {
    res.set('Authorization', `Bearer ${response.payload.metadata.token}`);
  }

  res.send(response.responseBody());
})
 
userRouter.get('/signout', verifyToken, async (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  // const data = req.body;
  // console.log(token);
  const response = await service.signOut({token: token});
  res.send(response.responseBody());
})

userRouter.post('/signup', async (req, res) => {
  const data = req.body;
  const response = await service.signUp(data);
  res.send(response.responseBody());
})

userRouter.get('/user-info/:userId', verifyToken, async (req, res) => {
  const data = req.params;
  const response = await service.getUserInfo(data);
  res.send(response.responseBody());
});

userRouter.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email']})
);

userRouter.get('/google/redirect', 
  passport.authenticate('google', { failureRedirect: '/signin' }),
  async (req, res) => {
    const data = req.session.passport.user;
    const response = await service.signInWithOauth(data);
    const responseData = response.responseBody();
    const userInfo = JSON.stringify(responseData.metadata.userInfo);
    const accessToken = JSON.stringify(responseData.metadata.token);
    console.log(process.env.URL_FE);
    res.redirect(`${process.env.URL_FE}/oauth2/?userInfo=${userInfo}&accessToken=${accessToken}`);
  }
);

module.exports = { userRouter };