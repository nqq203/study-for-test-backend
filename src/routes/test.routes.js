const express = require('express');
const TestService = require('../services/testService');
const service = new TestService();
const testRouter = express.Router();
require('dotenv').config();
const { verifyToken } = require('../middlewares/authorization');
const {
  CreatedResponse, 
  SuccessResponse,
} = require('../common/success.response');
const { uploads, uploadFileToCloud } = require("../utils/cloudinary");

testRouter.post('/create-test-content-by-pdf', async (req, res) => {
  const data = req.body;
  const response = await service.createTestContentByPDF(data);
  res.send(response.responseBody());
})

testRouter.post('/create-test', async (req, res) => {
  const data = req.body;
  const response = await service.createTest(data);
  res.send(response.responseBody());
})

testRouter.get('/get-list-test', async (req, res) => {
  const response = await service.getListTest();
  res.send(response.responseBody());
})

testRouter.post('/get-list-test-done', async (req, res) => {
  const data = req.body;
  const response = await service.getListTestDone(data);
  res.send(response.responseBody());
})

testRouter.post('/get-list-test-not-done', async (req, res) => {
  const data = req.body;
  const response = await service.getListTestNotDone(data);
  res.send(response.responseBody());
})

testRouter.post('/create-test-content-by-pdf', async (req, res) => {
  const data = req.body;
  const response = await service.createTestContentByPDF(data);
  res.send(response.responseBody());
})

testRouter.post('/create-test-results', async (req, res) => {
  const data = req.body;
  const response = await service.createTestResults(data);
  res.send(response.responseBody());
})

testRouter.get('/get-test-results/:testId', async (req, res) => {
  const data = req.params;
  const response = await service.getTestResults(data);
  res.send(response.responseBody());
})

// chưa test
testRouter.post('/get-user-answer', async (req, res) => {
  const data = req.body;
  const response = await service.getUserAnswer(data);
  res.send(response.responseBody());
})

testRouter.get('/get-test-detail/:testId', async (req, res) => {
  const data = req.params;
  const response = await service.getTestDetail(data);
  res.send(response.responseBody());
})

testRouter.get('/get-section-detail/:testId/:sectionId', async (req, res) => {
  const data = req.params;
  const response = await service.getSectionDetail(data);
  res.send(response.responseBody());
})

// chưa test
testRouter.post('/submit-writing-test', uploads.single("fileZip"), async (req, res) => {
  const fileZip = req.file;
  const userId = req.body.userId;
  const testId = req.body.testId;
  const sectionId = req.body.sectionId;
  const userAnswer = req.body.userAnswer;
  const response = await service.submitWritingTest({userId, testId, sectionId, userAnswer, fileZip});
  res.send(response.responseBody());
})

// chưa test
testRouter.post('/submit-speaking-test', uploads.single("fileZip"), async (req, res) => {
  const fileZip = req.file;
  const userId = req.body.userId;
  const testId = req.body.testId;
  const sectionId = req.body.sectionId;
  const response = await service.submitSpeakingTest({userId, testId, sectionId, fileZip});
  res.send(response.responseBody());
})

// chưa test
testRouter.post('/submit-quiz-test', async (req, res) => {
  const data = req.body;
  const response = await service.submitQuizTest(data);
  res.send(response.responseBody());
})

// chưa test - nhma chắc đúng
testRouter.post('/get-speaking-user-answer', async (req, res) => {
  const data = req.body;
  const response = await service.getSpeakingUserAnswer(data);
  res.send(response.responseBody());
})

// chưa test - nhma chắc đúng
testRouter.post('/get-writing-user-answer', async (req, res) => {
  const data = req.body;
  const response = await service.getWritingUserAnswer(data);
  res.send(response.responseBody());
})

// chưa test - nhma chắc đúng
testRouter.get('/get-history-board/:userId', async (req, res) => {
  const data = req.params;
  const response = await service.getHistoryBoard(data);
  res.send(response.responseBody());
})

// chưa test
testRouter.get('/get-weekly-activity/:userId', async (req, res) => {
  const data = req.params;
  const response = await service.getWeeklyActivity(data);
  res.send(response.responseBody());
})

module.exports = { testRouter };