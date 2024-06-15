const express = require('express');
const TestService = require('../services/testService');
const service = new TestService();
const testRouter = express.Router();
require('dotenv').config();
const { verifyToken, checkRoles } = require('../middlewares/authorization');
const {
  CreatedResponse, 
  SuccessResponse,
} = require('../common/success.response');
const { uploads, uploadFileToCloud } = require("../utils/cloudinary");
const { fetchAndProcessPDF, processPDF } = require("../utils/utils");

// testRouter.post('/create-test-content-by-pdf', verifyToken, checkRoles, uploads.array("pdfFiles"),async (req, res) => {
//   const data = req.body;
//   const response = await service.createTestContentByPDF(data);
//   res.send(response.responseBody());
// })

testRouter.post('/create-test-content-by-pdf', verifyToken, checkRoles, uploads.array("pdfFiles"),async (req, res) => {
  const userId = req.body.userId;
  const testId = req.body.testId;
  const audioUrl = req.body.audioUrl;
  const pdfFiles = req.files;

  console.log(11111111111111111111111);
  console.log(userId, testId, audioUrl)
  console.log(pdfFiles);
  const readUrl = await uploadFileToCloud(pdfFiles[0]);
  const listenUrl = await uploadFileToCloud(pdfFiles[1]);
  const speakUrl = await uploadFileToCloud(pdfFiles[2]);
  const writeUrl = await uploadFileToCloud(pdfFiles[3]);
  const resultUrl = await uploadFileToCloud(pdfFiles[4]);

  const tempRead = await processPDF(readUrl);
  const tempListen = await processPDF(listenUrl);
  const tempSpeak = await processPDF(speakUrl);
  const tempWrite = await processPDF(writeUrl);
  const testResults = await fetchAndProcessPDF(resultUrl);

  const testContent = {
    Reading: tempRead.Reading,
    Listening: tempListen.Listening,
    Speaking: tempSpeak.Speaking,
    Writing: tempWrite.Writing,
  }

  const response = await service.createTestContentByPDF({userId, testId, testContent, audioUrl});
  const tempRes = await service.createTestResults({testId, testResults});

  console.log(tempRes);
  res.send(response.responseBody());
})

testRouter.post('/create-test', verifyToken, checkRoles, async (req, res) => {
  const data = req.body;
  const response = await service.createTest(data);
  res.send(response.responseBody());
})

testRouter.get('/get-list-test/:userId', async (req, res) => {
  // const response = await service.getListTest();
  const data = req.params;
  const done = await service.getListTestDone(data);
  const notDone = await service.getListTestNotDone(data);
  console.log(done);
  console.log(notDone);
  let listTestDone = done.payload?.metadata ? [...done.payload.metadata] : [];
  let lisTestNotDone = notDone.payload?.metadata ? [...notDone.payload.metadata] : [];

  const listTest = listTestDone.concat(lisTestNotDone);
  console.log(listTest);
  const response = new SuccessResponse({
    success: true,
    message: "Get list test successfully!",
    code: 200,
    metadata: listTest,
  });
  res.send(response.responseBody());
})

testRouter.post('/get-list-test-done', verifyToken, async (req, res) => {
  const data = req.body;
  const response = await service.getListTestDone(data);
  res.send(response.responseBody());
})

testRouter.post('/get-list-test-not-done', verifyToken, async (req, res) => {
  const data = req.body;
  const response = await service.getListTestNotDone(data);
  res.send(response.responseBody());
})

// testRouter.post('/create-test-results', verifyToken, async (req, res) => {
//   const data = req.body;
//   const response = await service.createTestResults(data);
//   res.send(response.responseBody());
// })

testRouter.post('/create-test-results', verifyToken, checkRoles, uploads.single('file'), async (req, res) => {
  const testId = req.body.testId;
  const file = req.file;

  const resultUrl = await uploadFileToCloud(file);
  const testResults = await fetchAndProcessPDF(resultUrl);

  const response = await service.createTestResults({testId, testResults});
  res.send(response.responseBody());
})

testRouter.get('/get-test-results/:testId', verifyToken, async (req, res) => {
  const data = req.params;
  const response = await service.getTestResults(data);
  res.send(response.responseBody());
})

testRouter.post('/get-user-answer', verifyToken, async (req, res) => {
  const data = req.body;
  const response = await service.getUserAnswer(data);
  res.send(response.responseBody());
})

testRouter.get('/get-test-detail/:userId/:testId', verifyToken, async (req, res) => {
  const data = req.params;
  const response = await service.getTestDetail(data);
  res.send(response.responseBody());
})

testRouter.get('/get-section-detail/:testId/:sectionId', verifyToken, async (req, res) => {
  const data = req.params;
  console.log(data);
  const response = await service.getSectionDetail(data);
  res.send(response.responseBody());
})

testRouter.post('/submit-writing-test',verifyToken, uploads.single("fileZip"), async (req, res) => {
  const fileZip = req.file;
  const userId = req.body.userId;
  const testId = req.body.testId;
  const sectionId = req.body.sectionId;
  const userAnswer = JSON.parse(req.body.userAnswer);
  const response = await service.submitWritingTest({userId, testId, sectionId, userAnswer, fileZip});
  res.send(response.responseBody());
})

testRouter.post('/submit-speaking-test',verifyToken, uploads.single("fileZip"), async (req, res) => {
  const fileZip = req.file;
  const userId = req.body.userId;
  const testId = req.body.testId;
  const sectionId = req.body.sectionId;
  const response = await service.submitSpeakingTest({userId, testId, sectionId, fileZip});
  res.send(response.responseBody());
})

testRouter.post('/submit-quiz-test', verifyToken, async (req, res) => {
  const data = req.body;
  const response = await service.submitQuizTest(data);
  res.send(response.responseBody());
})

testRouter.post('/get-speaking-user-answer', async (req, res) => {
  const data = req.body;
  const response = await service.getSpeakingUserAnswer(data);
  res.send(response.responseBody());
})

testRouter.post('/get-writing-user-answer', async (req, res) => {
  const data = req.body;
  const response = await service.getWritingUserAnswer(data);
  res.send(response.responseBody());
})

testRouter.get('/get-history-board/:userId', verifyToken, async (req, res) => {
  const data = req.params;
  console.log(req.params);
  console.log(data, "hehehehehe");
  const response = await service.getHistoryBoard(data);
  res.send(response.responseBody());
})

testRouter.get('/get-weekly-activity/:userId', verifyToken, async (req, res) => {
  const data = req.params;
  const response = await service.getWeeklyActivity(data);
  res.send(response.responseBody());
})

testRouter.get('/get-resources', verifyToken, async (req, res) => {
  console.log("hello");
  const response = await service.getResourceUrl();
  res.send(response.responseBody());
})

testRouter.get('/get-intructor-test/:userId', verifyToken, async (req, res) => {
  const data = req.params;
  const response = await service.getInstructorTest(data);
  res.send(response.responseBody());
})

testRouter.post('/search-instructor-test/', verifyToken,  async (req, res) => {
  const data = req.body;
  const response = await service.searchInstructorTest(data);
  res.send(response.responseBody());
})

testRouter.post('/uploadfile', uploads.single('file'), async (req, res) => {
  const file = req.file;
  const response = await uploadFileToCloud(file);
  console.log(response);
  res.send({
    success: true,
    metadata: response
  });
})

testRouter.delete('/delete-test/:testId', verifyToken, checkRoles, async (req, res) => {
  const data = req.params;
  const response = await service.deleteTest(data);
  res.send(response.responseBody());
});

module.exports = { testRouter };