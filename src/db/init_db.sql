CREATE DATABASE IF NOT EXISTS StudyForTestDB;
USE StudyForTestDB;

-- Tạo bảng Users
CREATE TABLE Users (
    userId INT AUTO_INCREMENT PRIMARY KEY,
    fullName VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    userType VARCHAR(50)
);

-- Tạo bảng Sessions
CREATE TABLE Sessions (
    sessionId INT AUTO_INCREMENT PRIMARY KEY,
    createdDate DATETIME,
    expiredDate DATETIME,
    userId INT,
    FOREIGN KEY (userId) REFERENCES Users(userId)
);

-- Tạo bảng Tests
CREATE TABLE Tests (
    testId INT AUTO_INCREMENT PRIMARY KEY,
    testName VARCHAR(255),
    createdBy INT,
    dateCreated DATETIME,
    FOREIGN KEY (createdBy) REFERENCES Users(userId)
);

-- Tạo bảng UserTests
CREATE TABLE UserTests (
    userId INT,
    testId INT,
    dateTaken DATETIME,
    score INT,
    PRIMARY KEY (userId, testId),
    FOREIGN KEY (userId) REFERENCES Users(userId),
    FOREIGN KEY (testId) REFERENCES Tests(testId)
);

-- Tạo bảng Resources
CREATE TABLE Resources (
    resourceId INT AUTO_INCREMENT PRIMARY KEY,
    resourceType VARCHAR(50),
    resourceUrl VARCHAR(255)
);

-- Tạo bảng TestSections
CREATE TABLE TestSections (
    sectionId INT AUTO_INCREMENT PRIMARY KEY,
    testId INT,
    sectionType VARCHAR(50),
    resourceId INT,
    FOREIGN KEY (testId) REFERENCES Tests(testId),
    FOREIGN KEY (resourceId) REFERENCES Resources(resourceId)
);

-- Tạo bảng Questions
CREATE TABLE Questions (
    questionId INT AUTO_INCREMENT PRIMARY KEY,
    questionText TEXT,
    sectionId INT,
    FOREIGN KEY (sectionId) REFERENCES TestSections(sectionId)
);

-- Tạo bảng EssayAnswers
CREATE TABLE EssayAnswers (
    essayAnswerId INT AUTO_INCREMENT PRIMARY KEY,
    answerContent TEXT,
    questionId INT,
    FOREIGN KEY (questionId) REFERENCES Questions(questionId)
);

-- Tạo bảng SpeakingAnswers
CREATE TABLE SpeakingAnswers (
    speakingAnswerId INT AUTO_INCREMENT PRIMARY KEY,
    urlAnswerContent VARCHAR(255),
    questionId INT,
    FOREIGN KEY (questionId) REFERENCES Questions(questionId)
);

-- Tạo bảng QuizAnswers
CREATE TABLE QuizAnswers (
    quizAnswerId INT AUTO_INCREMENT PRIMARY KEY,
    answerName VARCHAR(255),
    isCorrectAnswer BOOLEAN,
    questionId INT,
    FOREIGN KEY (questionId) REFERENCES Questions(questionId)
);

DROP TABLE Sessions;
DROP TABLE UserTests;
DROP TABLE Tests;
DROP TABLE Users;
DROP TABLE Resources;
DROP TABLE TestSections;
DROP TABLE Questions;
DROP TABLE EssayAnswers;
DROP TABLE SpeakingAnswers;
DROP TABLE QuizAnswers;
