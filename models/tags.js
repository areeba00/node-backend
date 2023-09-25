const mongoose = require("mongoose");

const tagsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 50,
  },
});

const Tags = mongoose.model("Tags", tagsSchema);

module.exports = {
  Tags,
};
