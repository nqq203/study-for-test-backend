const express = require('express');
const UserService = require('../services/userService');
const service = new UserService();
const userRouter = express.Router();
require('dotenv').config();
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

userRouter.post('/signout', async (req, res) => {
  const data = req.body;
  const response = await service.signOut(data);
  res.send(response.responseBody());
})

userRouter.post('/signup', async (req, res) => {
  const data = req.body;
  const response = await service.signUp(data);
  res.send(response.responseBody());
})

module.exports = { userRouter };