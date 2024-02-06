const db = require("mongoose");
const DB_URI = process.env.DB_URI;
const dbConnect = (cb) => {
  db.connect(DB_URI);

  db.connection.once("open", () => {
    console.log("Database is connected!");
    cb();
  });
};

module.exports = dbConnect;
