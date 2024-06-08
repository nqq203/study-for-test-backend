const TestRepository = require('../repositories/testRepository');
const UserRepository = require('../repositories/userRepository');
const SectionRepository = require('../repositories/sectionRepository');
const DoingTestRepository = require('../repositories/doingTestRepository');
const QuestionRepository = require('../repositories/questionRepository');
const AnswerRepository = require('../repositories/answerRepository');
const ResultRepository = require('../repositories/resultRepository');
const UserAnswerRepository = require('../repositories/userAnswerRepository')
const { db } = require('../db/init');
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
const moment = require("moment");
const { uploadFileToCloud } = require("../utils/cloudinary");
const { getStartAndEndOfWeek } = require("../utils/utils");

module.exports = class TestService {
  constructor() {
    this.db = db;
    this.testRepository = new TestRepository();
    this.userRepository = new UserRepository();
    this.sectionRepository = new SectionRepository();
    this.doingTestRepository = new DoingTestRepository();
    this.questionRepository = new QuestionRepository();
    this.answerRepository = new AnswerRepository();
    this.resultRepository = new ResultRepository();
    this.userAnswerRepository = new UserAnswerRepository();
  }

  async getListTest() {
    const tests = await this.testRepository.getAll();
    return new SuccessResponse({
      success: true,
      message: "Get list test successfully!",
      code: 200,
      metadata: tests,
    });
  }

  async getListTestDone({ userId }) {
    if (!userId) {
      return new BadRequest("Missing user id");
    }

    const tests = await this.doingTestRepository.getByEntity({ userId: userId });
    if (tests.length === 0) {
      return new NotFoundResponse("Test not found");
    }

    return new SuccessResponse({
      success: true,
      message: "Get list test done successfully!",
      code: 200,
      data: tests[0],
    });
  }

  async getListTestNotDone({ userId }) {
    if (!userId) {
      return new BadRequest("Missing user id");
    }

    let sql = `SELECT T.testId, T.testName, T.dateCreated
              FROM Tests T
              WHERE NOT EXISTS (
                  SELECT 1
                  FROM DoingTests DT
                  WHERE DT.testId = T.testId AND DT.userId = ?
              );`

    const tests = await new Promise((resolve, reject) => {
      this.db.all(sql, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    if (!tests) {
      return new InternalServerError('Get list test not done failed with internal server error');
    };

    return new SuccessResponse(
      {
        success: true,
        message: "Get list test not done successfully!",
        code: 200,
        metadata: tests,
      }
    );
  }

  async createTest({ testName, createdBy }) {
    if (!testName) {
      return new BadRequest("Missing filed testName field");
    }

    if (!createdBy) {
      return new BadRequest("Missing filed createdBy field");
    }

    const existUser = await this.userRepository.getByEntity({ userId: createdBy });
    if (!existUser) {
      return new NotFoundResponse("User not found");
    }

    const dateCreated = moment().format("DD/MM/YYYY").toString();
    const newTest = await this.testRepository.create({
      testName: testName,
      createdBy: createdBy,
      dateCreated: dateCreated,
      audioUrl: null,
    });

    if (!newTest) {
      return new InternalServerError("Create test failed");
    }

    return new CreatedResponse({
      success: true,
      message: "Create test successfully!",
      code: 200,
      metadata: newTest,
    });
  }

  async createTestContentByPDF({ userId, testId, testContent, audioUrl }) {
    if (!testId) {
      return new BadRequest("Missing testId field");
    }

    if (!audioUrl) {
      return new BadRequest("Missing audioUrl field");
    }

    if (!testContent) {
      return new BadRequest("Missing testContent field");
    }

    const existUser = await this.userRepository.getByEntity({ userId: userId });
    if (!existUser) {
      return new NotFoundResponse("User not found");
    }

    if (!testContent.Writing) {
      return new BadRequest("Missing writing file");
    }
    if (!testContent.Reading) {
      return new BadRequest("Missing reading file");
    }
    if (!testContent.Listening) {
      return new BadRequest("Missing listening file");
    }
    if (!testContent.Speaking) {
      return new BadRequest("Missing speaking file");
    }
    if (!audioUrl) {
      return new BadRequest("Missing audio file");
    }

    const oldTest = await this.testRepository.getByEntity({ testId: testId });
    console.log(oldTest);
    const updatedTest = await this.testRepository.update({
      testId: testId,
      audioUrl: audioUrl,
      testName: oldTest[0].testName,
      createdBy: userId,
      dateCreated: oldTest[0].dateCreated
    });

    // console.log(updatedTest);
    if (!updatedTest.updated) {
      return new InternalServerError("Update test failed");
    }

    const writingSection = await this.sectionRepository.create({
      testId: Number(testId),
      sectionType: 'writing',
    })

    if (!writingSection.sectionId) {
      return new InternalServerError("Create writing section failed");
    }

    const readingSection = await this.sectionRepository.create({
      testId: Number(testId),
      sectionType: 'reading',
    })

    if (!readingSection.sectionId) {
      return new InternalServerError("Create reading section failed");
    }

    const listeningSection = await this.sectionRepository.create({
      testId: Number(testId),
      sectionType: 'listening',
    })

    if (!listeningSection.sectionId) {
      return new InternalServerError("Create listening section failed");
    }


    const speakingSection = await this.sectionRepository.create({
      testId: Number(testId),
      sectionType: 'speaking',
    })

    if (!speakingSection.sectionId) {
      return new InternalServerError("Create speaking section failed");
    }

    await this.createListeningQuestion(listeningSection.sectionId, testContent.Listening);
    // console.log("hereeeeeeeeeee");
    await this.createReadingQuestion(readingSection.sectionId, testContent.Reading);
    await this.createWritingQuestion(writingSection.sectionId, testContent.Writing);
    await this.createSpeakingQuestion(speakingSection.sectionId, testContent.Speaking);

    return new CreatedResponse({
      success: true,
      message: "Create test successfully!",
      code: 200,
      metadata: {
        testId: testId,
      }
    });
  }

  async createListeningQuestion(sectionId, listeningData) {
    for (let item of listeningData) {
      // Create the question entry in the database
      const question = await this.questionRepository.create({
        sectionId: sectionId,
        questionText: item.question,
        questionDescription: null
      });
      // console.log(item);

      // Check if the question was successfully created
      if (question) {
        for (let answer of item.answers) {
          // Create each answer associated with the question
          await this.answerRepository.create({
            questionId: question.questionId,  // assuming the question creation returns an id
            answerName: answer,
          });
        }
      } else {
        console.error("Failed to create question: " + item.question);
        throw new InternalServerError("Failed to create a listening question.");
      }
    }
  }

  async createReadingQuestion(sectionId, readingData) {
    for (let item of readingData) {
      // Create the question entry in the database
      for (let q of item.questions) {
        const question = await this.questionRepository.create({
          sectionId: sectionId,
          questionText: q.question,
          questionDescription: item.content
        });

        if (question) {
          for (let answer of q.answers) {
            // Create each answer associated with the question
            await this.answerRepository.create({
              questionId: question.questionId,  // assuming the question creation returns an id
              answerName: answer,
            });
          }
        }
        else {
          console.error("Failed to create question: " + item.question);
          throw new InternalServerError("Failed to create a listening question.");
        }
      }
    }
  }

  async createWritingQuestion(sectionId, writingData) {
    for (let item of writingData) {
      // Create the question entry in the database
      const question = await this.questionRepository.create({
        sectionId: sectionId,
        questionText: item.question,
        questionDescription: item.description,
      });

      if (question) {
        if (item.words.length > 0) {
          for (let word of item.words) {
            await this.answerRepository.create({
              questionId: question.questionId,
              answerName: word
            });
          }
        }
        else {
          await this.answerRepository.create({
            questionId: question.questionId,
            answerName: null
          });
        }
      }
      else {
        console.error("Failed to create question: " + item.question);
        throw new InternalServerError("Failed to create a writing question.");
      }
    }
  }

  async createSpeakingQuestion(sectionId, speakingData) {
    for (let item of speakingData) {
      // Create the question entry in the database
      const question = await this.questionRepository.create({
        sectionId: sectionId,
        questionText: item.question,
        questionDescription: null,
      });

      if (question) {
        await this.answerRepository.create({
          questionId: question.questionId,
          answerName: null
        });
      }
      else {
        console.error("Failed to create question: " + item.question);
        throw new InternalServerError("Failed to create a speaking question.");
      }
    }
  }

  async createTestResults({ testId, testResults }) {
    if (!testId) {
      return new BadRequest("Missing testId field");
    }

    const existTest = await this.testRepository.getByEntity({ testId: testId });
    if (!existTest) {
      return new NotFoundResponse("Test not found");
    }

    if (!testResults) {
      return new BadRequest("Missing testResults field");
    }

    const testSections = await this.sectionRepository.getByEntity({ testId: Number(testId) });
    let readingSection, listeningSection, writingSection;
    for (let section of testSections) {
      if (section.sectionType === "reading") {
        readingSection = section;
      }
      else if (section.sectionType === "listening") {
        listeningSection = section;
      }
      else if (section.sectionType === "writing") {
        writingSection = section;
      }
    }

    let readingResults, listeningResults, writingResults;
    for (let results of testResults) {
      if (results.sectionType === "reading") {
        readingResults = results.results;
      }
      else if (results.sectionType === "listening") {
        listeningResults = results.results;
      }
      else if (results.sectionType === "writing") {
        writingResults = results.results;
      }
    }

    const readingQuestions = await this.questionRepository.getByEntity({ sectionId: readingSection.sectionId });
    const listeningQuestions = await this.questionRepository.getByEntity({ sectionId: listeningSection.sectionId });
    const writingQuestions = await this.questionRepository.getByEntity({ sectionId: writingSection.sectionId });

    const newReadingResults = [], newListeningResults = [];
    let i = 0;
    for (let question of readingQuestions) {
      let result = await this.resultRepository.create({ questionId: question.questionId, resultContent: readingResults[i++] });
      if (!result.resultId) {
        return new InternalServerError("Create reading result failed");
      }
      let newResult = await this.resultRepository.getByEntity({ resultId: result.resultId });
      newReadingResults.push(newResult);
    }
    i = 0;
    for (let question of listeningQuestions) {
      let result = await this.resultRepository.create({ questionId: question.questionId, resultContent: listeningResults[i++] });
      if (!result.resultId) {
        return new InternalServerError("Create listening result failed");
      }
      let newResult = await this.resultRepository.getByEntity({ resultId: result.resultId });
      newListeningResults.push(newResult);
    }

    let newWritingResults = writingResults.join(", ").toLowerCase();
    let newResult = await this.resultRepository.create({ questionId: writingQuestions[0].questionId, resultContent: newWritingResults });
    if (!newResult.resultId) {
      return new InternalServerError("Create writing result failed");
    }
    newWritingResults = await this.resultRepository.getByEntity({ resultId: newResult.resultId });

    return new CreatedResponse({
      success: true,
      message: "Create test results successfully!",
      code: 200,
      metadata: [
        {
          sectionType: "reading",
          results: newReadingResults
        },
        {
          sectionType: "listening",
          results: newListeningResults
        },
        {
          sectionType: "writing",
          results: newWritingResults
        }
      ]
    });
  }

  async getTestResults({ testId }) {
    if (!testId) {
      return new BadRequest("Missing testId field");
    }

    const existTest = await this.testRepository.getByEntity({ testId: testId });
    if (!existTest) {
      return new NotFoundResponse("Test not found");
    }

    const testSections = await this.sectionRepository.getByEntity({ testId: Number(testId) });
    let readingSection, listeningSection;
    for (let section of testSections) {
      if (section.sectionType === "reading") {
        readingSection = section;
      }
      else if (section.sectionType === "listening") {
        listeningSection = section;
      }
    }

    const readingQuestions = await this.questionRepository.getByEntity({ sectionId: readingSection.sectionId });
    const listeningQuestions = await this.questionRepository.getByEntity({ sectionId: listeningSection.sectionId });

    let readingResults = [], listeningResults = [];
    for (let question of readingQuestions) {
      let result = await this.resultRepository.getByEntity({ questionId: question.questionId });
      readingResults.push(result);
    }
    for (let question of listeningQuestions) {
      let result = await this.resultRepository.getByEntity({ questionId: question.questionId });
      listeningResults.push(result);
    }

    return new SuccessResponse({
      success: true,
      message: "Get test results successfully!",
      code: 200,
      metadata: {
        readingResults,
        listeningResults,
      },
    });
  }

  async getUserAnswer({ userId, testId }) {
    if (!userId) {
      return new BadRequest("Missing userId field");
    }
    if (!testId) {
      return new BadRequest("Missing testId field");
    }

    const existTest = await this.doingTestRepository.getByEntity({ userId: userId, testId: testId });
    if (existTest.length === 0) {
      return new NotFoundResponse("Test not found");
    }

    const userAnswers = await this.userAnswerRepository.getByEntity({ userId: userId, testId: testId });
    if (!userAnswers) {
      return new NotFoundResponse("User answer not found");
    }

    return new SuccessResponse({
      success: true,
      message: "Get user answer successfully!",
      code: 200,
      metadata: userAnswers
    });
  }

  async getTestDetail({ testId }) {
    if (!testId) {
      return new BadRequest("Missing testId field");
    }

    const existTest = await this.testRepository.getByEntity({ testId: testId });
    if (existTest.length === 0) {
      return new NotFoundResponse("Test not found");
    }

    const testSections = await this.sectionRepository.getByEntity({ testId: Number(testId) });
    let readingSection, listeningSection, speakingSection, writingSection;
    for (let section of testSections) {
      if (section.sectionType === "reading") {
        readingSection = section;
      }
      else if (section.sectionType === "listening") {
        listeningSection = section;
      }
      else if (section.sectionType === "speaking") {
        speakingSection = section;
      }
      else if (section.sectionType === "writing") {
        writingSection = section;
      }
    }

    return new SuccessResponse({
      success: true,
      message: "Get test detail successfully!",
      code: 200,
      metadata: {
        testId: Number(testId),
        readingSection,
        listeningSection,
        speakingSection,
        writingSection,
      },
    })
  }

  async getSectionDetail({ testId, sectionId }) {
    if (!testId) {
      return new BadRequest("Missing testId field");
    }

    if (!sectionId) {
      return new BadRequest("Missing sectionId field");
    }

    const section = await this.sectionRepository.getByEntity({ sectionId: sectionId, testId: testId });
    if (section.length === 0) {
      return new NotFoundResponse("Section not found");
    }
    const questions = await this.questionRepository.getByEntity({ sectionId: sectionId });
    const QnA = [];
    for (let question of questions) {
      console.log("question Id: ", question.questionId);
      const answer = await this.answerRepository.getByEntity({ questionId: question.questionId });
      console.log(answer);
      QnA.push({
        question,
        answer
      });
    }
    return new SuccessResponse({
      success: true,
      message: "Get section detail successfully!",
      code: 200,
      metadata: {
        section: section[0],
        questions: QnA
      }
    });
  }

  async submitWritingTest({ userId, testId, sectionId, userAnswer, fileZip }) {
    if (!userId) {
      return new BadRequest("Missing userId field");
    }
    if (!testId) {
      return new BadRequest("Missing testId field");
    }
    if (!sectionId) {
      return new BadRequest("Missing sectionId field");
    }
    if (!userAnswer) {
      return new BadRequest("Missing userAnswer field");
    }

    if (!fileZip) {
      return new BadRequest("Can not submit because losing zip file");
    }

    const existTest = await this.testRepository.getByEntity({ testId: testId });
    if (existTest.length === 0) {
      return new NotFoundResponse("Test not found");
    }

    const existSection = await this.sectionRepository.getByEntity({ sectionId: sectionId, testId: testId });
    if (existSection.length === 0) {
      return new NotFoundResponse("Section not found");
    }

    const question = await this.questionRepository.getByEntity({ sectionId: sectionId });
    const a = userAnswer.join(", ").toLowerCase();
    const newUserAnswer = await this.userAnswerRepository.create({
      userId: Number(userId),
      testId: Number(testId),
      questionId: question[0].questionId,
      userAnswer: a
    })
    if (!newUserAnswer) {
      return new InternalServerError("Create user answer failed");
    }

    let score = 0;
    let tempResult = this.resultRepository.getByEntity({ questionId: question[0].questionId });
    if (tempResult.length > 0) {
      let tempResultArr = tempResult[0].split(', ');
      for (let i = 0; i < tempResultArr.length; i++) {
        if (tempResultArr[i] === userAnswer[i]) {
          score += 1;
        }
      }
    }

    const writingUrl = await uploadFileToCloud(fileZip);

    const doingTest = this.doingTestRepository.getByEntity({ userId: userId, testId: testId });
    if (doingTest.length > 0) {
      const dateTaken = moment().format('DD/MM/YYYY hh:mm:ss').toString();
      const newDoingTest = await this.doingTestRepository.update({
        userId: Number(userId),
        testId: Number(testId),
        dateTaken: dateTaken,
        score: score,
        writingUrl: writingUrl,
        speakingUrl: doingTest[0].speakingUrl
      });
      if (!newDoingTest.updated) {
        return new InternalServerError("Create doing test failed");
      }
    }
    else {
      const dateTaken = moment().format('DD/MM/YYYY hh:mm:ss').toString();
      const newDoingTest = await this.doingTestRepository.create({
        userId: Number(userId),
        testId: Number(testId),
        dateTaken: dateTaken,
        score: score,
        writingUrl: writingUrl,
        speakingUrl: null
      });
      if (!newDoingTest.testId || !newDoingTest.userId) {
        return new InternalServerError("Create doing test failed");
      }
    }

    return new SuccessResponse({
      success: true,
      message: "Submit writing test successfully!",
      code: 200,
      metadata: {
        score: score
      }
    });
  }

  async submitSpeakingTest({ userId, testId, sectionId, fileZip }) {
    if (!userId) {
      return new BadRequest("Missing userId field");
    }
    if (!testId) {
      return new BadRequest("Missing testId field");
    }
    if (!sectionId) {
      return new BadRequest("Missing sectionId field");
    }

    if (!fileZip) {
      return new BadRequest("Can not submit because losing zip file");
    }

    const existTest = await this.testRepository.getByEntity({ testId: testId });
    if (existTest.length === 0) {
      return new NotFoundResponse("Test not found");
    }

    const existSection = await this.sectionRepository.getByEntity({ sectionId: sectionId, testId: testId });
    if (existSection.length === 0) {
      return new NotFoundResponse("Section not found");
    }

    const speakingUrl = await uploadFileToCloud(fileZip);

    const doingTest = this.doingTestRepository.getByEntity({ userId: userId, testId: testId });
    if (doingTest.length > 0) {
      const dateTaken = moment().format('DD/MM/YYYY hh:mm:ss').toString();
      const newDoingTest = await this.doingTestRepository.update({
        userId: Number(userId),
        testId: Number(testId),
        dateTaken: dateTaken,
        score: score,
        writingUrl: doingTest[0].writingUrl,
        speakingUrl: speakingUrl
      });
      if (!newDoingTest.updated) {
        return new InternalServerError("Create doing test failed");
      }
    }
    else {
      const dateTaken = moment().format('DD/MM/YYYY hh:mm:ss').toString();
      const newDoingTest = await this.doingTestRepository.create({
        userId: Number(userId),
        testId: Number(testId),
        dateTaken: dateTaken,
        score: score,
        writingUrl: null,
        speakingUrl: speakingUrl,
      });
      if (!newDoingTest.testId || !newDoingTest.userId) {
        return new InternalServerError("Create doing test failed");
      }
    }

    return new SuccessResponse({
      success: true,
      message: "Submit writing test successfully!",
      code: 200,
    });
  }

  async submitQuizTest({userId, testId, sectionId, userAnswer}) {
    // user answer co dung sau: 
    const temp = [
      {
        questionId: 1,
        userAnswerContent: 'A'
      },
      {
        questionId: 2,
        userAnswerContent: 'B'
      }
    ]


    if (!userId) {
      return new BadRequest("Missing userId field");
    }
    if (!testId) {
      return new BadRequest("Missing testId field");
    }
    if (!sectionId) {
      return new BadRequest("Missing sectionId field");
    }

    const existTest = await this.testRepository.getByEntity({ testId: testId });
    if (existTest.length === 0) {
      return new NotFoundResponse("Test not found");
    }

    const existSection = await this.sectionRepository.getByEntity({ sectionId: sectionId, testId: testId });
    if (existSection.length === 0) {
      return new NotFoundResponse("Section not found");
    }

    const questions = await this.questionRepository.getByEntity({ sectionId: sectionId });
    let i = 0;
    let score = 0;
    for (let question of questions) {
      const answer = await this.userAnswerRepository.create({
        userId: Number(userId), 
        testId: Number(testId),
        questionId: question.questionId,
        userAnswerContet: userAnswer[i].userAnswerContent
      })
      if (!answer) {
        return new InternalServerError("Create user answer failed");
      }
      const tempResult = await this.resultRepository.getByEntity({ questionId: question.questionId });
      if (tempResult[0].resultContent.toLowerCase() === userAnswer[i].userAnswerContent.toLowerCase()) {
        score += 1;
      }
      i++;
    }
  }

  async getSpeakingUserAnswer({ userId, testId }) { // get speaking url file 
    if (!userId) {
      return new BadRequest("Missing userId field");
    }
    if (!testId) {
      return new BadRequest("Missing testId field");
    }

    const existTest = await this.doingTestRepository.getByEntity({ userId: userId, testId: testId });
    if (existTest.length === 0) {
      return new NotFoundResponse("Test not found");
    }

    const speakingUrl = existTest[0].speakingUrl;
    return new SuccessResponse({
      success: true,
      message: "Get speaking url successfully!",
      code: 200,
      metadata: {
        speakingUrl: speakingUrl
      }
    });
  }

  async getWritingUserAnswer({ userId, testId }) { // get writing url file 
    if (!userId) {
      return new BadRequest("Missing userId field");
    }
    if (!testId) {
      return new BadRequest("Missing testId field");
    }

    const existTest = await this.doingTestRepository.getByEntity({ userId: userId, testId: testId });
    if (existTest.length === 0) {
      return new NotFoundResponse("Test not found");
    }

    const writingUrl = existTest[0].writingUrl;
    return new SuccessResponse({
      success: true,
      message: "Get writing url successfully!",
      code: 200,
      metadata: {
        writingUrl: writingUrl
      }
    });
  }

  async getHistoryBoard({ userId }) {
    if (!userId) {
      return new BadRequest("Missing userId field");
    }

    const doingTest = await this.doingTestRepository.getByEntity({ userId: userId });
    if (doingTest.length === 0) {
      return new NotFoundResponse("Doing test not found");
    }

    let sql = `SELECT T.testName, DT.dateTaken, DT.score, S.sectionType
              FROM Tests T
              JOIN DoingTests DT ON T.testId = DT.testId
              JOIN Sections S ON T.testId = S.testId
              WHERE DT.userId = ?
              ORDER BY DT.dateTaken DESC;`

    const history = await new Promise((resolve, reject) => {
      this.db.all(sql, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    if (history.length === 0) {
      return new InternalServerError('Get history board faield');
    };

    return new SuccessResponse(
      {
        success: true,
        message: "Get list test not done successfully!",
        code: 200,
        metadata: history,
      }
    );
  }

  async getWeeklyActivity({ userId }) {
    if (!userId) {
      return new BadRequest("Missing userId field");
    }
  
    const { start, end } = getStartAndEndOfWeek(new Date()); // Hoặc truyền ngày cụ thể
  
    const sql = `
      SELECT dateTaken, COUNT(*) as testCount
      FROM DoingTests
      WHERE userId = ? AND dateTaken BETWEEN ? AND ?
      GROUP BY dateTaken
      ORDER BY dateTaken;
    `;
  
    try {
      const doingTest = await this.db.all(sql, [userId, start, end]);
      if (doingTest.length === 0) {
        return new NotFoundResponse("No tests found for this week");
      }
      return doingTest;
    } catch (error) {
      return new InternalServerError("Database error: " + error.message);
    }
  }
}