const { db } = require('../db/init');

module.exports = class UserRepository {
  constructor() {
    this.db = db;
  }
  
  create(data) {
    const sql = `INSERT INTO Users (fullName, email, password, userType) VALUES (?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.fullName, data.email, data.password, data.userType], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({userId: this.lastID});
        }
      });
    });
  }

  getByEntity(data) {
    let sql = `SELECT * FROM Users WHERE `;
    const params = [];
    const conditions = [];
    if (data.userId) {
      conditions.push(`userId = ?`);
      params.push(data.userId);
    }
    if (data.email) {
      conditions.push(`email = ?`);
      params.push(data.email);
    }
  
    sql += conditions.join(' AND ');
  
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  getAll() {
    const sql = `SELECT * FROM Users`;
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
    const sql = `UPDATE Users SET fullname = ?, email = ?, password = ?, userType = ? WHERE userId = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.fullName, data.email, data.password, data.userType, data.userId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ updated: this.changes });
        }
      });
    });
  }

  delete(data) {
    const sql = `DELETE FROM Users WHERE userId = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.userId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes });
        }
      });
    });
  }
}