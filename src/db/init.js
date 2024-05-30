const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./src/db/StudyForTestDB.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, async (err) => {
    if (err) {
        console.error("Error when connecting to the database", err.message);
    } else {
        console.log('Connected to the SQLite database.');
        await initializeDB();
    }
});

async function initializeDB() {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS Users (
                userId INTEGER PRIMARY KEY AUTOINCREMENT,
                fullName TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                userType TEXT
            );
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS Sessions (
                sessionId INTEGER PRIMARY KEY AUTOINCREMENT,
                status TEXT,
                logoutAt TEXT,
                userId INTEGER,
                FOREIGN KEY (userId) REFERENCES Users(userId)
            );
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS Tests (
                testId INTEGER PRIMARY KEY AUTOINCREMENT,
                testName TEXT,
                createdBy INTEGER,
                dateCreated TEXT,
                FOREIGN KEY (createdBy) REFERENCES Users(userId)
            );
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS UserTests (
                userId INTEGER,
                testId INTEGER,
                dateTaken TEXT,
                score INTEGER,
                PRIMARY KEY (userId, testId),
                FOREIGN KEY (userId) REFERENCES Users(userId),
                FOREIGN KEY (testId) REFERENCES Tests(testId)
            );
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS Resources (
                resourceId INTEGER PRIMARY KEY AUTOINCREMENT,
                resourceType TEXT,
                resourceUrl TEXT
            );
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS TestSections (
                sectionId INTEGER PRIMARY KEY AUTOINCREMENT,
                testId INTEGER,
                sectionType TEXT,
                resourceId INTEGER,
                FOREIGN KEY (testId) REFERENCES Tests(testId),
                FOREIGN KEY (resourceId) REFERENCES Resources(resourceId)
            );
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS Questions (
                questionId INTEGER PRIMARY KEY AUTOINCREMENT,
                questionText TEXT,
                sectionId INTEGER,
                FOREIGN KEY (sectionId) REFERENCES TestSections(sectionId)
            );
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS EssayAnswers (
                essayAnswerId INTEGER PRIMARY KEY AUTOINCREMENT,
                answerContent TEXT,
                questionId INTEGER,
                FOREIGN KEY (questionId) REFERENCES Questions(questionId)
            );
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS SpeakingAnswers (
                speakingAnswerId INTEGER PRIMARY KEY AUTOINCREMENT,
                urlAnswerContent TEXT,
                questionId INTEGER,
                FOREIGN KEY (questionId) REFERENCES Questions(questionId)
            );
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS QuizAnswers (
                quizAnswerId INTEGER PRIMARY KEY AUTOINCREMENT,
                answerName TEXT,
                isCorrectAnswer BOOLEAN,
                questionId INTEGER,
                FOREIGN KEY (questionId) REFERENCES Questions(questionId)
            );
        // `, 
        // () => {
        //     // Close the database connection
        //     db.close((err) => {
        //         if (err) {
        //             return console.error(err.message);
        //         }
        //         console.log('Closed the database connection.');
        //     });
        // });
        );
    });
}

module.exports = { db };