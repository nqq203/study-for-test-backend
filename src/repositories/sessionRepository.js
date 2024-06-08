const { db } = require('../db/init');

module.exports = class SessionRepository {
  constructor() {
    this.db = db;
  }
  
  create(data) {
    const sql = `INSERT INTO Sessions (status, logoutAt, userId) VALUES (?, ?, ?)`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.status, data.logoutAt, data.userId], function(err) {
        if (err) {
          reject(err);
        } else {
          // console.log(this);
          // console.log(this.lastID);
          resolve({sessionId: this.lastID});
        }
      })
    })
  }

  getByEntity(data) {
    let sql = `SELECT * FROM Sessions WHERE `;
    const params = [];
    const conditions = [];
  
    if (data.sessionId) {
      conditions.push(`sessionId = ?`);
      params.push(data.sessionId);
    }

    if (data.userId) {
      conditions.push(`userId = ?`);
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
    const sql = `SELECT * FROM Sessions`;
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
    const sql = `UPDATE Sessions SET status = ?, logoutAt = ?, userId = ? WHERE sessionId = ?`;
    console.log(data);
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.status, data.logoutAt, data.userId, data.sessionId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ updated: this.changes });
        }
      });
    });
  }

  delete(data) {
    const sql = `DELETE FROM Sessions WHERE sessionId = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [data.sessionId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes });
        }
      });
    });
  }
}