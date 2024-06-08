const { db } = require('../db/init');

module.exports = class AnswerRepository {
  constructor() {
    this.db = db;
  }
  
  create(data) {
    const sql = `INSERT INTO Answers (questionId, answerName) VALUES (?,?)`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.questionId, data.answerName], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({testId: this.lastID});
        }
      });
    });
  }

  getByEntity(data) {
    let sql = `SELECT * FROM Answers WHERE `;
    const params = [];
    const conditions = [];
  
    if (data.questionId) {
      conditions.push(`questionId = ?`);
      params.push(data.questionId);
    }
    if (data.answerId) {
      conditions.push(`answerId = ?`);
      params.push(data.answerId);
    }
    
    sql += conditions.join(' AND ');
  
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  getAll() {
    const sql = `SELECT * FROM Answers`;
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
    const sql = `UPDATE Answers SET questionId = ?, answerName = ? WHERE answerId = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.questionId, data.answerName, data.answerId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ updated: this.changes });
        }
      });
    });
  }

  delete(data) {
    const sql = `DELETE FROM Answers WHERE answerId = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.answerId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes });
        }
      });
    });
  }
}