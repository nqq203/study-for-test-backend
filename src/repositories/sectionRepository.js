const { db } = require('../db/init');

module.exports = class SectionRepository {
  constructor() {
    this.db = db;
  }
  
  create(data) {
    const sql = `INSERT INTO Sections (testId, sectionType) VALUES (?, ?)`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.testId, data.sectionType], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({sectionId: this.lastID});
        }
      })
    })
  }

  getByEntity(data) {
    let sql = `SELECT * FROM Sections WHERE `;
    const params = [];
    const conditions = [];
  
    if (data.sectionId) {
      conditions.push(`sectionId = ?`);
      params.push(data.sectionId);  // Sửa từ sessionId thành sectionId
    }

    if (data.testId) {
      conditions.push(`testId = ?`);
      params.push(data.testId);  // Sửa từ email thành testId
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
    const sql = `SELECT * FROM Sections`;
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
    const sql = `UPDATE Sections SET testId = ?, sectionType = ? WHERE sectionId = ?`;
    // console.log(data);
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.testId, data.sectionType, data.sectionId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ updated: this.changes });
        }
      });
    });
  }

  delete(data) {
    const sql = `DELETE FROM Sections WHERE sectionId = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.sectionId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes });
        }
      });
    });
  }
}