const { db } = require('../db/init');

module.exports = class UserAnswerRepository {
  constructor() {
    this.db = db;
  }

  async createOrUpdate(data) {
    const checkSql = `SELECT 1 FROM UserAnswers WHERE userId = ? AND testId = ? AND sectionId = ? AND questionId = ?`;
    const insertSql = `INSERT INTO UserAnswers (userId, testId, sectionId, questionId, userAnswerContent) VALUES (?, ?, ?, ?, ?)`;
    const updateSql = `UPDATE UserAnswers SET userAnswerContent = ? WHERE userId = ? AND testId = ? AND sectionId = ? AND questionId = ?`;
  
    return new Promise((resolve, reject) => {
      this.db.get(checkSql, [data.userId, data.testId, data.sectionId, data.questionId], (err, row) => {
        if (err) {
          return reject(err);
        }
        if (row) {
          // Update existing record
          this.db.run(updateSql, [data.userAnswerContent, data.userId, data.testId, data.sectionId, data.questionId], function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ message: "Answer updated", testId: data.testId, userId: data.userId, sectionId: data.sectionId, questionId: data.questionId });
            }
          });
        } else {
          // Insert new record
          this.db.run(insertSql, [data.userId, data.testId, data.sectionId, data.questionId, data.userAnswerContent], function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ message: "Answer inserted", testId: data.testId, userId: data.userId, sectionId: data.sectionId, questionId: data.questionId });
            }
          });
        }
      });
    });
  }
  
  create(data) {
    // console.log(data);
    const sql = `INSERT INTO UserAnswers (userId, testId, sectionId, questionId, userAnswerContent) VALUES (?,?,?,?,?)`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.userId, data.testId, data.sectionId, data.questionId, data.userAnswerContent], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({testId: data.testId, userId: data.userId, sectionId: data.sectionId, questionId: data.questionId});
        }
      });
    });
  }

  getByEntity(data) {
    let sql = `SELECT * FROM UserAnswers WHERE `;
    const params = [];
    const conditions = [];
  
    if (data.testId) {
      conditions.push(`testId = ?`);
      params.push(data.testId);
    }
    if (data.userId) {
      conditions.push(`userId = ?`);
      params.push(data.userId);
    }
    if (data.sectionId) {
      conditions.push(`sectionId = ?`);
      params.push(data.sectionId);
    }
    if(data.questionId) {
      conditions.push(`questionId =?`);
      params.push(data.questionId);
    }
    
    sql += conditions.join(' AND ');
  
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  getAll() {
    const sql = `SELECT * FROM UserAnswers`;
    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  update(data) {
    const sql = `UPDATE Tests SET userAnswerContent = ? WHERE userId = ? AND testId = ? AND sectionId = ? AND questionId = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.userAnswerContent, data.userId, data.testId, data.sectionId, data.questionId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ updated: this.changes });
        }
      });
    });
  }

  delete(data) {
    const sql = `DELETE FROM Tests WHERE userId = ? AND testId = ? AND sectionId = ? AND questionId = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.userId, data.testId, data.sectionId, data.questionId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes });
        }
      });
    });
  }
}