const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./src/db/DB.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, async (err) => {
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
                audioUrl TEXT,
                createdBy INTEGER,
                dateCreated TEXT,
                deletedDate TEXT,
                FOREIGN KEY (createdBy) REFERENCES Users(userId)
            );
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS Sections (
                sectionId INTEGER PRIMARY KEY AUTOINCREMENT,
                testId INTEGER,
                sectionType TEXT,
                FOREIGN KEY (testId) REFERENCES Tests(testId)
            );
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS DoingTests (
                userId INTEGER,
                testId INTEGER,
                sectionId INTEGER,
                dateTaken TEXT,
                score INTEGER,
                writingUrl TEXT,
                speakingUrl TEXT,
                PRIMARY KEY (userId, testId, sectionId),
                FOREIGN KEY (userId) REFERENCES Users(userId),
                FOREIGN KEY (testId) REFERENCES Tests(testId),
                FOREIGN KEY (sectionId) REFERENCES Sections(sectionId)
            );
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS Questions (
                questionId INTEGER PRIMARY KEY AUTOINCREMENT,
                questionText TEXT,
                questionDescription TEXT,
                sectionId INTEGER,
                FOREIGN KEY (sectionId) REFERENCES Sections(sectionId)
            );
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS Answers (
                answerId INTEGER PRIMARY KEY AUTOINCREMENT,
                answerName TEXT,
                questionId INTEGER,
                FOREIGN KEY (questionId) REFERENCES Questions(questionId)
            );
        `);
        
        db.run(`
            CREATE TABLE IF NOT EXISTS Results (
                resultId INTEGER PRIMARY KEY AUTOINCREMENT,
                questionId INTEGER,
                resultContent TEXT,
                FOREIGN KEY (questionId) REFERENCES Questions(questionId)
            );
        `);

        db.run(`
            CREATE TABLE  IF NOT EXISTS UserAnswers (
                userId INTEGER,
                testId INTEGER,
                sectionId INTEGER,
                questionId INTEGER,
                userAnswerContent TEXT,
                PRIMARY KEY (userId, testId, sectionId, questionId),
                FOREIGN KEY (userId) REFERENCES DoingTests(userId),
                FOREIGN KEY (testId) REFERENCES DoingTests(testId),
                FOREIGN KEY (sectionId) REFERENCES DoingTests(sectionId),
                FOREIGN KEY (questionId) REFERENCES Questions(questionId)
            );
        `)
        // () => {
        //     // Close the database connection
        //     db.close((err) => {
        //         if (err) {
        //             return console.error(err.message);
        //         }
        //         console.log('Closed the database connection.');
        //     });
        // });
    });
}

module.exports = { db };