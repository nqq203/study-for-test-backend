const { db } = require('../db/init');

module.exports = class DoingTestRepository {
  constructor() {
    this.db = db;
  }

  async createOrUpdate(data) {
    const checkSql = `SELECT * FROM DoingTests WHERE userId = ? AND testId = ? AND sectionId = ?`;
    const insertSql = `INSERT INTO DoingTests (userId, testId, sectionId, dateTaken, score, writingUrl, speakingUrl) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const updateSql = `UPDATE DoingTests SET dateTaken = ?, score = ?, writingUrl = ?, speakingUrl = ? WHERE userId = ? AND testId = ? AND sectionId = ?`;
  
    return new Promise((resolve, reject) => {
      this.db.get(checkSql, [data.userId, data.testId, data.sectionId], (err, row) => {
        if (err) {
          return reject(err);
        }
        if (row) {
          // Update existing record
          this.db.run(updateSql, [data.dateTaken, data.score, data.writingUrl, data.speakingUrl, data.userId, data.testId, data.sectionId], function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ message: "Doing test updated", userId: data.userId, testId: data.testId, sectionId: data.sectionId, score: data.score });
            }
          });
        } else {
          // Insert new record
          this.db.run(insertSql, [data.userId, data.testId, data.sectionId, data.dateTaken, data.score, data.writingUrl, data.speakingUrl], function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ message: "Doing test inserted", userId: data.userId, testId: data.testId, sectionId: data.sectionId, score: data.score });
            }
          });
        }
      });
    });
  }
  
  create(data) {
    const sql = `INSERT INTO DoingTests (userId, testId, sectionId, dateTaken, score, writingUrl, speakingUrl) VALUES (?,?,?,?,?,?,?)`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.userId, data.testId, data.sectionId, data.dateTaken, data.score], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({userId: data.userId, testId: data.testId, sectionId: data.sectionId});
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
    if (data.sectionId) {
      conditions.push(`sectionId = ?`);
      params.push(data.sectionId);
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
    const sql = `UPDATE DoingTests SET dateTaken = ?, score = ?, writingUrl = ?, speakingUrl = ? WHERE userId = ? AND testId = ? AND sectionId = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.dateTaken, data.score, data.writingUrl, data.speakingUrl, data.userId, data.testId, data.sectionId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ updated: this.changes });
        }
      });
    });
  }

  delete(data) {
    const sql = `DELETE FROM DoingTest WHERE testId = ? AND userId = ? AND sectionId = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.testId, data.userId, data.sectionId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes });
        }
      });
    });
  }
}