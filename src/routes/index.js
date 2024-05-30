const { userRouter } = require("./user.routes");

module.exports = {
  userRouter
};

function route(app) {
  app.use("/users", userRouter);
}

  module.exports = route;
