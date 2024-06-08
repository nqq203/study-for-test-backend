const { db } = require('../db/init');

module.exports = class DoingTestRepository {
  constructor() {
    this.db = db;
  }
  
  create(data) {
    const sql = `INSERT INTO DoingTests (userId, testId, dateTaken, score, writingUrl, speakingUrl) VALUES (?,?,?,?,?,?)`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.userId, data.testId, data.dateTaken, data.score], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({userId: data.userId, testId: data.testId});
        }
      });
    });
  }

  getByEntity(data) {
    let sql = `SELECT * FROM DoingTests WHERE `;
    const params = [];
    const conditions = [];
  
    if (data.userId) {
      conditions.push(`userId = ?`);
      params.push(data.userId);
    }
    if (data.testId) {
      conditions.push(`testId = ?`);
      params.push(data.testId);
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
    const sql = `SELECT * FROM DoingTests`;
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
    const sql = `UPDATE DoingTests SET dateTaken = ?, score = ?, writingUrl = ?, speakingUrl = ? WHERE userId = ? AND testId = ? `;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.dateTaken, data.score, data.writingUrl, data.speakingUrl, data.userId, data.testId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ updated: this.changes });
        }
      });
    });
  }

  delete(data) {
    const sql = `DELETE FROM DoingTest WHERE testId = ? AND userId = ? `;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.testId, data.userId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes });
        }
      });
    });
  }
}