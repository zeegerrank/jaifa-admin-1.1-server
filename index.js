require("dotenv").config();const express = require("express");
const app = express();

app.use(express.json());

app.post("/", (req, res) => {
  return res.status(200).send({ message: "Hello world" });
});

//**set up routes */
app.use("/api/auth", require("./routes/auth.routes"));

//**set up server */
const PORT = process.env.PORT || 3500;
const openServer = () => {
  app.listen(PORT, () => {
    console.log("App is running on port", PORT);
  });
};

//** connect to db => open server */
const dbConnect = require("./db/dbConnect");
dbConnect(openServer);
