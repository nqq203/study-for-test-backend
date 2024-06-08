const { db } = require('../db/init');

module.exports = class QuestionRepository {
  constructor() {
    this.db = db;
  }
  
  create(data) {
    const sql = `INSERT INTO Questions (sectionId, questionText, questionDescription) VALUES (?,?,?)`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.sectionId, data.questionText, data.questionDescription], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({questionId: this.lastID});
        }
      });
    });
  }

  getByEntity(data) {
    let sql = `SELECT * FROM Questions WHERE `;
    const params = [];
    const conditions = [];
  
    if (data.sectionId) {
      conditions.push(`sectionId = ?`);
      params.push(data.sectionId);
    }
    if (data.questionId) {
      conditions.push(`questionId = ?`);
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
    const sql = `SELECT * FROM Questions`;
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
    const sql = `UPDATE Questions SET sectionId = ?, questionText = ?, questionDescription = ? WHERE questionId = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.sectionId, data.questionText, data.questionDescription, data.questionId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ updated: this.changes });
        }
      });
    });
  }

  delete(data) {
    const sql = `DELETE FROM Questions WHERE questionId = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.testId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes });
        }
      });
    });
  }
}