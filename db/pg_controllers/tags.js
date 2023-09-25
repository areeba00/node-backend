const { StatusCodes } = require("http-status-codes");
const knex = require("../knex");

exports.getAllTags = async (req, res) => {
  const tags = await knex.select().from("tags");
  if (tags.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).send("No tags found");
  }
  return res.send(tags);
};
