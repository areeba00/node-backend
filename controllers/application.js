const { StatusCodes } = require("http-status-codes");
const Joi = require("joi");
const { Application, validate } = require("../models/applications");

const validateQuery = Joi.object({
  name: Joi.string().min(3).optional(),
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
});

exports.getAllApplications = async (req, res) => {
  const { error, value } = validateQuery.validate(req.query);

  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).send(error.details[0].message);
  }

  const { page = 1, limit = 100, ...query } = value;

  const totalCount = await Application.countDocuments(query);

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  // Find the applications matching the query with pagination
  const application = await Application.find(query)
    .skip(offset)
    .limit(limit)
    .toArray();
  if (application.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).send("No applications found");
  }

  return res.send({ TotalCount: totalCount, application });
};

exports.getApplicationById = async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application)
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The app with given ID is not found");
  return res.send(application);
};

exports.create = async (req, res) => {
  const { error } = validate(req.body);
  if (error)
    return res.status(StatusCodes.BAD_REQUEST).send(error.details[0].message);

  const { name, description } = req.body;

  // Check if an existing application with the same name already exists
  const existingApplication = await Application.findOne({ name });
  if (existingApplication)
    return res
      .status(StatusCodes.CONFLICT)
      .send("An application with the same name already exists");

  let application = new Application({ name, description });
  application = await application.save();
  return res.send(application);
};

exports.update = async (req, res) => {
  const { error } = validate(req.body);
  if (error)
    return res.status(StatusCodes.BAD_REQUEST).send(error.details[0].message);
  const application = await Application.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
    },
    { new: true }
  );
  if (!application)
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The app with given ID is not found");
  return res.send(application);
};

exports.patch = async (req, res) => {
  const { id } = req.params;

  const existingApplication = await Application.findById(id);

  if (!existingApplication) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The application with the given ID is not found");
  }

  const { name, description } = req.body;
  const updatedApplication = {
    name: name || existingApplication.name,
    description: description || existingApplication.description,
  };

  const application = await Application.findByIdAndUpdate(
    id,
    updatedApplication,
    { new: true }
  );

  return res.send(application);
};

exports.delete = async (req, res) => {
  const application = await Application.findByIdAndRemove(req.params.id);
  if (!application)
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The app with given ID is not found");
  return res.send(application);
};
