const express = require('express');
const UserService = require('../services/userService');
const service = new UserService();
const userRouter = express.Router();
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
  const response = await service.signOut({token: token});
  res.send(response.responseBody());
})

userRouter.post('/signup', async (req, res) => {
  const data = req.body;
  const response = await service.signUp(data);
  res.send(response.responseBody());
})

module.exports = { userRouter };