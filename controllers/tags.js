const { Tags } = require("../models/tags");

exports.readAll = async (req, res) => {
  const tags = await Tags.find();
  return res.send(tags);
};
