const { db } = require('../db/init');

module.exports = class ResultRepository {
  constructor() {
    this.db = db;
  }
  
  create(data) {
    const sql = `INSERT INTO Results (questionId, resultContent) VALUES (?,?)`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.questionId, data.resultContent], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({resultId: this.lastID});
        }
      });
    });
  }

  getByEntity(data) {
    let sql = `SELECT * FROM Results WHERE `;
    const params = [];
    const conditions = [];
  
    if (data.questionId) {
      conditions.push(`questionId = ?`);
      params.push(data.questionId);
    }
    if (data.resultId) {
      conditions.push(`resultId = ?`);
      params.push(data.resultId);
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
    const sql = `SELECT * FROM Results`;
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
    const sql = `UPDATE Results SET questionId = ?, resultContent = ? WHERE resultId = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.questionId, data.resultContent, data.resultId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ updated: this.changes });
        }
      });
    });
  }

  delete(data) {
    const sql = `DELETE FROM Results WHERE resultId = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.resultId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes });
        }
      });
    });
  }
}