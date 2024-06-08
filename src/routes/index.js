const { userRouter } = require("./user.routes");
const { testRouter } = require("./test.routes");

module.exports = {
  userRouter,
  testRouter,
};

function route(app) {
  app.use("/users", userRouter);
  app.use("/tests", testRouter);
}

module.exports = route;
