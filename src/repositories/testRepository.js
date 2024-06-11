const { db } = require('../db/init');

module.exports = class TestRepository {
  constructor() {
    this.db = db;
  }
  
  create(data) {
    const sql = `INSERT INTO Tests (testName, audioUrl, createdBy, dateCreated, deletedDate) VALUES (?,?,?,?,?)`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.testName, data.audioUrl, data.createdBy, data.dateCreated, data.deletedDate], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({testId: this.lastID});
        }
      });
    });
  }

  getByEntity(data) {
    let sql = `SELECT * FROM Tests WHERE `;
    const params = [];
    const conditions = [];
  
    if (data.testId) {
      conditions.push(`testId = ?`);
      params.push(data.testId);
    }
    if (data.createdBy) {
      conditions.push(`createdBy = ?`);
      params.push(data.createdBy);
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
    const sql = `SELECT * FROM Tests`;
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
    const sql = `UPDATE Tests SET testName = ?, audioUrl = ?, createdBy = ?, dateCreated = ?, deletedDate = ? WHERE testId = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.testName, data.audioUrl, data.createdBy, data.dateCreated, data.deletedDate, data.testId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ updated: this.changes });
        }
      });
    });
  }

  delete(data) {
    const sql = `DELETE FROM Tests WHERE testId = ?`;
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