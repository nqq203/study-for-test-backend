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
const { getStartAndEndOfWeek, fillWeekData } = require("../utils/utils");

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

    let sql = `SELECT DISTINCT T.testId, T.testName, T.dateCreated
              FROM Tests T, DoingTests DT
              WHERE DT.testId = T.testId AND T.deletedDate IS NULL AND DT.userId = ?;`

    const tests = await new Promise((resolve, reject) => {
      this.db.all(sql, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    if (tests.length === 0) {
      return new NotFoundResponse("Test not found");
    }

    const data = tests.map(test => {
      return { ...test, status: "complete" }
    })

    return new SuccessResponse({
      success: true,
      message: "Get list test done successfully!",
      code: 200,
      metadata: data,
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
              ) AND T.deletedDate IS NULL;`

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

    const data = tests.map((test) => {
      return { ...test, status: "incomplete" };
    });

    return new SuccessResponse(
      {
        success: true,
        message: "Get list test not done successfully!",
        code: 200,
        metadata: data,
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

    const dateCreated = moment().format("YYYY-MM-DD").toString();
    const newTest = await this.testRepository.create({
      testName: testName,
      createdBy: createdBy,
      dateCreated: dateCreated,
      audioUrl: null,
      deletedDate: null,
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
    console.log(testSections);
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

    console.log(readingSection, listeningSection, writingSection);
    const readingQuestions = await this.questionRepository.getByEntity({ sectionId: readingSection.sectionId });
    const listeningQuestions = await this.questionRepository.getByEntity({ sectionId: listeningSection.sectionId });
    const writingQuestions = await this.questionRepository.getByEntity({ sectionId: writingSection.sectionId });

    let readingResults = [], listeningResults = [];
    for (let question of readingQuestions) {
      let result = await this.resultRepository.getByEntity({ questionId: question.questionId });
      readingResults.push(result[0]);
    }
    for (let question of listeningQuestions) {
      let result = await this.resultRepository.getByEntity({ questionId: question.questionId });
      listeningResults.push(result[0]);
    }
    let result = await this.resultRepository.getByEntity({ questionId: writingQuestions[0].questionId })
    let writingResults = result.length > 0 && result[0].resultContent ? result[0].resultContent.split(', ') : [];

    return new SuccessResponse({
      success: true,
      message: "Get test results successfully!",
      code: 200,
      metadata: {
        readingResults,
        listeningResults,
        writingResults: {
          questionId: writingQuestions[0].questionId,
          resultContent: writingResults
        }
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

    const sections = await this.sectionRepository.getByEntity({ testId: testId });
    if (sections.length === 0) {
      return new NotFoundResponse("Sections not found");
    }

    const answersBySections = await Promise.all(sections.map(async (section) => {
      const questions = await this.questionRepository.getByEntity({ sectionId: section.sectionId });
      const answers = await Promise.all(questions.map(async (question) => {
        const userAnswer = await this.userAnswerRepository.getByEntity({
          userId: userId,
          testId: testId,
          questionId: question.questionId
        });
        return {
          questionId: question.questionId,
          questionText: question.questionText,
          userAnswerContent: userAnswer.length > 0 ? userAnswer[0].userAnswerContent : "No answer"
        };
      }));
      return {
        sectionId: section.sectionId,
        sectionType: section.sectionType,
        questions: answers
      };
    }));

    return new SuccessResponse({
      success: true,
      message: "Get user answer successfully!",
      code: 200,
      metadata: answersBySections
    });
  }

  async getTestDetail({ userId, testId }) {
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

    const user = await this.userRepository.getByEntity({ userId: existTest[0].createdBy });
    const doingTest = await this.doingTestRepository.getByEntity({ userId: userId, testId: testId});
    const reading = doingTest.find((dt) => dt.sectionId === readingSection.sectionId);
    const listening = doingTest.find((dt) => dt.sectionId === listeningSection.sectionId);
    const writing = doingTest.find((dt) => dt.sectionId === writingSection.sectionId);
    
    const testInfo = { ...existTest[0], userCreatedName: user.fullName, readingScore: reading  ? reading.score : 0, writingScore: writing  ? writing.score : 0, listeningScore: listening ? listening.score : 0};

    return new SuccessResponse({
      success: true,
      message: "Get test detail successfully!",
      code: 200,
      metadata: {
        test: testInfo,
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
    const a = userAnswer.join(", ").toLowerCase().toString();
    const newUserAnswer = await this.userAnswerRepository.createOrUpdate({
      userId: Number(userId),
      testId: Number(testId),
      sectionId: Number(sectionId),
      questionId: question[0].questionId,
      userAnswerContent: a
    })
    if (!newUserAnswer) {
      return new InternalServerError("Create user answer failed");
    }

    console.log("qua dayyyyy");

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

    const doingTest = await this.doingTestRepository.getByEntity({ userId: userId, testId: testId, sectionId: sectionId });
    console.log(doingTest.length);
    const dateTaken = moment().format('YYYY-MM-DD').toString();
    await this.doingTestRepository.createOrUpdate({
      userId: Number(userId),
      testId: Number(testId),
      sectionId: Number(sectionId),
      dateTaken,
      score: score,
      writingUrl: writingUrl, // or appropriate URL if applicable
      speakingUrl: doingTest.length > 0 ? doingTest[0].speakingUrl : null // or appropriate URL if applicable
    });

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

    const doingTest = await this.doingTestRepository.getByEntity({ userId: userId, testId: testId, sectionId: sectionId });
    console.log(doingTest);
    const dateTaken = moment().format('YYYY-MM-DD').toString();
    await this.doingTestRepository.createOrUpdate({
      userId: Number(userId),
      testId: Number(testId),
      sectionId: Number(sectionId),
      dateTaken,
      score: 0,
      writingUrl: doingTest.length > 0 ? doingTest[0].writingUrl : null, // or appropriate URL if applicable
      speakingUrl: speakingUrl // or appropriate URL if applicable
    });

    return new SuccessResponse({
      success: true,
      message: "Submit writing test successfully!",
      code: 200,
    });
  }

  async submitQuizTest({ userId, testId, sectionId, userAnswer }) {
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

    // Chuyển userAnswer thành map dựa trên questionId
    const answerMap = userAnswer.reduce((map, answer) => {
      map[answer.questionId] = answer.userAnswerContent;
      return map;
    }, {});

    const questions = await this.questionRepository.getByEntity({ sectionId: sectionId });
    let score = 0;

    for (let question of questions) {
      const userAnsContent = answerMap[question.questionId];
      if (!userAnsContent) continue; // Bỏ qua nếu không tìm thấy câu trả lời cho câu hỏi này

      const answer = await this.userAnswerRepository.createOrUpdate({
        userId: Number(userId),
        testId: Number(testId),
        sectionId: Number(sectionId),
        questionId: question.questionId,
        userAnswerContent: userAnsContent
      });
      if (!answer) {
        return new InternalServerError("Create user answer failed");
      }

      const tempResult = await this.resultRepository.getByEntity({ questionId: question.questionId });
      if (tempResult.length > 0 && tempResult[0].resultContent.toLowerCase() === userAnsContent.toLowerCase()) {
        score += 1;
      }
    }

    console.log("zooooooooooooooooooooooooooooooooooooooooo");
    const doingTest = this.doingTestRepository.getByEntity({ userId: userId, testId: testId, sectionId: sectionId });
    // Update or create doing test entry
    const dateTaken = moment().format('YYYY-MM-DD').toString();
    await this.doingTestRepository.createOrUpdate({
      userId: Number(userId),
      testId: Number(testId),
      sectionId: Number(sectionId),
      dateTaken,
      score: score,
      writingUrl: doingTest.length > 0 ? doingTest[0].writingUrl : null, // or appropriate URL if applicable
      speakingUrl: doingTest.length > 0 ? doingTest[0].speakingUrl : null // or appropriate URL if applicable
    });

      return new SuccessResponse({
        success: true,
        message: "Submit quiz test successfully!",
        code: 200,
        metadata: {
          score: score
        }
      })
    }

  // async submitQuizTest({ userId, testId, sectionId, userAnswers }) {
  //   if (!userId) {
  //     return new BadRequest("Missing userId field");
  //   }
  //   if (!testId) {
  //     return new BadRequest("Missing testId field");
  //   }
  //   if (!sectionId) {
  //     return new BadRequest("Missing sectionId field");
  //   }
  
  //   const testExists = await this.testRepository.getByEntity({ testId });
  //   if (!testExists.length) {
  //     return new NotFoundResponse("Test not found");
  //   }
  
  //   const sectionExists = await this.sectionRepository.getByEntity({ sectionId, testId });
  //   if (!sectionExists.length) {
  //     return new NotFoundResponse("Section not found");
  //   }
  
  //   const questions = await this.questionRepository.getByEntity({ sectionId });
  //   let score = 0;
  
  //   for (let question of questions) {
  //     const userAnswer = userAnswers.find(answer => answer.questionId === question.questionId);
  //     if (!userAnswer || !userAnswer.userAnswerContent) continue;
  
  //     // Store user answer to database (assumed async operation)
  //     await this.userAnswerRepository.createOrUpdate({
  //       userId: userId,
  //       testId: testId,
  //       sectionId: sectionId,
  //       questionId: question.questionId,
  //       userAnswerContent: userAnswer.userAnswerContent
  //     });
  
  //     // Fetch the correct answer for comparison
  //     const correctAnswer = await this.resultRepository.getByEntity({ questionId: question.questionId });
  //     if (correctAnswer.length && correctAnswer[0].resultContent.toLowerCase() === userAnswer.userAnswerContent.toLowerCase()) {
  //       score += 1;  // Increment score if answers match
  //     }
  //   }
  
  //   // Update or create the test attempt record
  //   const dateTaken = moment().format("YYYY-MM-DD");
  //   const doingTestUpdate = await this.doingTestRepository.createOrUpdate({
  //     userId: userId,
  //     testId: testId,
  //     sectionId: sectionId,
  //     dateTaken: dateTaken,  // Simplified date setting
  //     score: score,
  //     writingUrl: sectionExists[0].writingUrl || null,  // Assuming this is fetched correctly elsewhere
  //     speakingUrl: sectionExists[0].speakingUrl || null
  //   });
  
  //   return new SuccessResponse({
  //     success: true,
  //     message: "Submit quiz test successfully!",
  //     code: 200,
  //     metadata: {
  //       score: score
  //     }
  //   });
  // }

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

    const sections = await this.sectionRepository.getByEntity({testId: testId});
    let speakingSection = sections.find((section) => section.sectionType === 'speaking')
    const speakingUrl = speakingSection.find((section) => section.sectionId === speakingSection[0].sectionId);
    
    const user = await this.userRepository.getByEntity({userId: userId});

    return new SuccessResponse({
      success: true,
      message: "Get speaking url successfully!",
      code: 200,
      metadata: {
        userInfo: user,
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

    const sections = await this.sectionRepository.getByEntity({testId: testId});
    let writingSection = sections.find((section) => section.sectionType === 'writing')
    const writingUrl = writingSection.find((section) => section.sectionId === writingSection[0].sectionId);
    
    const user = await this.userRepository.getByEntity({userId: userId});

    return new SuccessResponse({
      success: true,
      message: "Get writing url successfully!",
      code: 200,
      metadata: {
        userInfo: user,
        writingUrl: writingUrl
      }
    });
  }

  async getResourceUrl() {
    const doingTests = await this.doingTestRepository.getAll();
    
    // Lọc ra những bản ghi có writingUrl hoặc speakingUrl
    const filteredDoingTests = doingTests.filter(test => test.writingUrl || test.speakingUrl);

    // Dùng Promise.all để xử lý bất đồng bộ cho việc lấy thông tin người dùng
    const userInfos = await Promise.all(
        filteredDoingTests.map(async (test) => {
            // Lấy thông tin người dùng dựa trên userId
            const userInfo = await this.userRepository.getByEntity({ userId: test.userId });
            const testInfo = await this.testRepository.getByEntity({ testId: test.testId });
            // Trả về cả thông tin người dùng và url liên quan
            return {
                userInfo: userInfo,
                resourceUrl: test.writingUrl || test.speakingUrl,
                testName: testInfo[0].testName,
            };
        })
    );

    console.log(userInfos);
    return new SuccessResponse({
      success: true,
      message: "Get resource url successfully!",
      code: 200,
      metadata: userInfos,
    })
  }

  async getInstructorTest({ userId }) {
    let sql = "SELECT * FROM Tests WHERE deletedDate IS NULL AND createdBy = ?;";
    const tests = await new Promise((resolve, reject) => {
      this.db.all(sql, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
    return new SuccessResponse({
      success: true,
      message: "Get list test successfully!",
      code: 200,
      metadata: tests,
    });
  }

  async searchInstructorTest({ input }) {
    let sql;
    let data;
  
    if (input.trim() === '') {
      // If the input is empty or just spaces, fetch all tests
      sql = `SELECT * FROM Tests WHERE deletedDate IS NULL ORDER BY testName;`;
      data = await new Promise((resolve, reject) => {
        this.db.all(sql, (err, results) => {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        });
      });
    } else {
      // If there is some input, use it to filter the tests
      const searchPattern = `%${input}%`;
      sql = `
        SELECT * 
        FROM Tests
        WHERE testName LIKE ? AND deletedDate IS NULL
        ORDER BY testName;
      `;
      data = await new Promise((resolve, reject) => {
        this.db.all(sql, [searchPattern], (err, results) => {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        });
      });
    }
  
    return new SuccessResponse({
      success: true,
      message: "Search successfully!",
      code: 200,
      metadata: data,
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
              FROM DoingTests DT, Tests T, Sections S
              WHERE DT.userId = ? AND T.testId = DT.testId AND DT.sectionId = S.sectionId
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
      SELECT strftime('%Y-%m-%d', dateTaken) AS dateTaken, COUNT(*) AS testCount
      FROM DoingTests
      WHERE userId = ? AND date(dateTaken) BETWEEN date(?) AND date(?)
      GROUP BY date(dateTaken)
      ORDER BY dateTaken;
    `;

    const startStr = start.toString();
    const endStr = end.toString();

      const testCounts = await new Promise((resolve, reject) => {
        this.db.all(sql, [userId, startStr, endStr], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });

      console.log("qua day");
      console.log(testCounts);

      // Đảm bảo dữ liệu cho mọi ngày trong tuần
      const data = fillWeekData(testCounts, start, end);
      
      console.log(data);
      return new SuccessResponse({
        success: true,
        message: "Get weekly activity successfully!",
        code: 200,
        metadata: data,
      });
  }

  async deleteTest({ testId }) {
    if (!testId) {
      return new BadRequest("Missing testId field");
    }
    
    const deletedDate = moment().format('YYYY-MM-DD').toString();
    const oldTest = await this.testRepository.getByEntity({testId});

    const test = await this.testRepository.update({
      testId: testId,
      testName: oldTest[0].testName,
      audioUrl: oldTest[0].audioUrl,
      createdBy: oldTest[0].createdBy,
      dateCreated: oldTest[0].dateCreated,      
      deletedDate: deletedDate
    });

    return new SuccessResponse({
      success: true,
      message: "Delete test successfully!",
      code: 200,
      metadata: test,
    });
  }
}