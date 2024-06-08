const express = require('express');
const session = require('express-session');
const app = express();
app.use(express.json());
const route = require("./routes/index");
const cors = require("cors");
const bodyParser = require("body-parser");
require('dotenv').config();
const PORT = process.env.PORT;
const passport = require('./configs/passsport.config');

app.use(
  cors({
    origin: process.env.URL_FE,
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE"
  })
);

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'keyboard cat',  // Chọn một chuỗi bí mật để mã hóa session cookie
  resave: false,            // Không lưu session lại nếu không có gì thay đổi
  saveUninitialized: false, // Không lưu session mới nếu chưa có gì được lưu
  cookie: { secure: process.env.NODE_ENV === 'production' } // Sử dụng cookie secure trong môi trường production
}));

app.use(passport.initialize());
app.use(passport.session());

route(app);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
