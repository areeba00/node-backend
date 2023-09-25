const { StatusCodes } = require("http-status-codes");
const Joi = require("joi");
const knex = require("../knex");

exports.validateApplication = function (application) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    description: Joi.string().min(5).max(200).required(),
    isActive: Joi.boolean(),
  });
  return schema.validate(application);
};

const validateQuery = Joi.object({
  name: Joi.string().min(3).optional(),
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  isActive: Joi.boolean().optional(),
  sortBy: Joi.string().valid("name", "created_at", "updated_at").optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional(),
});

exports.getAllApplications = async (req, res) => {
  // Validate query parameters using the Joi schema
  const { error, value } = validateQuery.validate(req.query);

  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).send(error.details[0].message);
  }

  const {
    page = 1,
    limit = 100,
    sortBy = "name",
    sortOrder = "asc",
    ...query
  } = value;

  delete query.page;
  delete query.limit;

  const countQuery = knex.count("* as total").where(query).from("application");
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  let applicationsQuery = knex
    .select()
    .offset(offset)
    .limit(limit)
    .where(query)
    .from("application");

  if (sortBy) {
    // If sortBy is provided in the query, add orderBy clause
    applicationsQuery = applicationsQuery.orderBy(sortBy, sortOrder);
  }

  const [applications, totalCount] = await Promise.all([
    applicationsQuery,
    countQuery,
  ]);

  if (applications.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).send("No applications found");
  }

  return res.send({ TotalCount: totalCount[0].total, applications });
};

exports.getApplicationById = async (req, res) => {
  const { id } = req.params;

  const application = await knex.from("application").where({ id }).first();

  if (!application) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The app with the given ID is not found");
  }

  return res.send(application);
};

exports.create = async (req, res) => {
  const { name, description } = req.body;

  // Convert the new application name to lowercase for case-insensitive comparison
  const lowerCaseName = name.toLowerCase();

  // Check if an existing application with the same name (case-insensitive) already exists
  const existingApplication = await knex
    .from("application")
    .whereRaw("LOWER(name) = ?", [lowerCaseName]) // Convert to lowercase for comparison
    .first();

  // Check if an existing application with the same name already exists
  // const existingApplication = await knex
  //   .from("application")
  //   .where({ name })
  //   .first();

  if (existingApplication) {
    return res
      .status(StatusCodes.CONFLICT)
      .send("An application with the same name already exists");
  }

  const application = await knex
    .from("application")
    .insert({ name, description })
    .returning("*");
  return res.send(application[0]);
};

exports.update = async (req, res) => {
  const { name, description, isActive } = req.body;
  const { id } = req.params;

  // Convert the new application name to lowercase for case-insensitive comparison
  const lowerCaseName = name.toLowerCase();

  // Check if there's any other application with the same name (case-insensitive) and different ID
  const existingApplication = await knex
    .from("application")
    .whereRaw("LOWER(name) = ? AND id != ?", [lowerCaseName, id]) // Convert to lowercase for comparison
    .first();

  if (existingApplication) {
    return res
      .status(StatusCodes.CONFLICT)
      .send("An application with the same name already exists");
  }

  const [application] = await knex
    .from("application")
    .where({ id })
    .update({ name, description, isActive })
    .returning("*");

  if (!application) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The app with the given ID is not found");
  }

  return res.send(application);
};

exports.patch = async (req, res) => {
  const { id } = req.params;

  const existingApplication = await knex
    .from("application")
    .where({ id })
    .first();

  if (!existingApplication) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The application with the given ID is not found");
  }
  if (existingApplication) {
    return res
      .status(StatusCodes.CONFLICT)
      .send("An application with the same name already exists");
  }

  const { name, description, isActive } = req.body;
  const updatedApplication = {
    name: name || existingApplication.name,
    description: description || existingApplication.description,
    isActive: isActive === undefined ? existingApplication.isActive : isActive,
  };

  const [application] = await knex
    .from("application")
    .where({ id })
    .update(updatedApplication)
    .returning("*");

  return res.send(application);
};

exports.delete = async (req, res) => {
  const { id } = req.params;

  const application = await knex.from("application").where({ id }).first();

  if (!application) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The app with the given ID is not found");
  }

  await knex.from("application").where({ id }).del();

  return res.send(application);
};
