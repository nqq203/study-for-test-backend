const express = require('express');
const app = express();
app.use(express.json());
const route = require("./routes/index");

const cors = require("cors");
const bodyParser = require("body-parser");
require('dotenv').config();
const PORT = process.env.PORT;

app.use(
  cors({
    origin: process.env.URL_FE,
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE"
  })
);

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

route(app);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
