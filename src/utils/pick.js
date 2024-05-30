const _ = require("lodash")

module.exports = (object = {}, pickUps = []) => {
  return _.pick(object, pickUps)
}