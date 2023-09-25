/* eslint-disable no-undef */
const { StatusCodes } = require("http-status-codes");
const { getAllApplications } = require("../../db/pg_controllers/applications");
const { getApplicationById } = require("../../db/pg_controllers/applications");
const { create } = require("../../db/pg_controllers/applications");
const { update } = require("../../db/pg_controllers/applications");
const {
  delete: deleteApplication,
} = require("../../db/pg_controllers/applications");
const controller = require("../../db/pg_controllers/applications");
const knex = require("../../db/knex");
// Mock the knex instance
jest.mock("../../db/knex", () => ({
  count: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  where: jest.fn(),
  first: jest.fn(),
  whereNot: jest.fn(),
  from: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  returning: jest.fn(),
  update: jest.fn().mockReturnThis(),
  del: jest.fn(),
}));

describe("validateApplication function", () => {
  it("should return undefined if application data is valid", () => {
    const validApplication = {
      name: "Test Application",
      description: "Test Description",
      isActive: true,
    };

    const result = controller.validateApplication(validApplication);

    expect(result.error).toBeUndefined();
    expect(result.value).toEqual(validApplication);
  });

  it("should return an error if the application name is less than 3 characters", () => {
    const invalidApplication = {
      name: "Te", // Less than 3 characters
      description: "Test Description",
      isActive: true,
    };

    const result = controller.validateApplication(invalidApplication);

    expect(result.error).toBeDefined();
    expect(result.error.details[0].message).toContain(
      '"name" length must be at least 3 characters long'
    );
  });

  it("should return an error if the description is less than 5 characters", () => {
    const invalidApplication = {
      name: "Test Application",
      description: "Desc", // Less than 5 characters
      isActive: true,
    };

    const result = controller.validateApplication(invalidApplication);

    expect(result.error).toBeDefined();
    expect(result.error.details[0].message).toContain(
      '"description" length must be at least 5 characters long'
    );
  });
});

describe("getAllApplications controller", () => {
  // Test case: Should return a list of applications with pagination and filtering
  it("should return a list of applications with pagination and filtering", async () => {
    const req = {
      query: {
        page: "1",
        limit: "10",
        isActive: true,
      },
    };
    const res = {
      status: jest.fn(() => res),
      send: jest.fn(),
    };

    // Prepare mock data
    const mockApplications = [
      { id: 1, name: "App 1", description: "Description 1", isActive: true },
      { id: 2, name: "App 2", description: "Description 2", isActive: false },
    ];
    const mockCount = [{ total: 1 }];

    // const { page, limit, ...query } = req.query;

    // Clone the req.query object and delete page and limit properties
    const query = { ...req.query };
    delete query.page;
    delete query.limit;

    // Mock the database query response

    knex.count = jest.fn().mockReturnThis(mockCount);
    knex.where = jest.fn().mockReturnThis();
    knex.from = jest.fn().mockReturnThis();
    knex.select = jest.fn().mockReturnThis();
    knex.offset = jest.fn().mockReturnThis();
    knex.limit = jest.fn().mockReturnThis();
    knex.where = jest.fn().mockReturnThis();
    knex.from = jest.fn().mockResolvedValue(mockApplications);
    // Make the request to the controller
    await getAllApplications(req, res);
    // Assertions
    // expect(knex.from).toHaveBeenCalled();
    expect(knex.count).toHaveBeenCalled();
    expect(knex.where).toHaveBeenCalledWith(query);
    expect(knex.from).toHaveBeenCalled();
    expect(knex.select).toHaveBeenCalled();
    expect(knex.offset).toHaveBeenCalledWith(0);
    expect(knex.limit).toHaveBeenCalledWith(10);
    expect(knex.where).toHaveBeenCalledWith(query);
    expect(knex.from).toHaveBeenCalledWith("application");

    expect(res.send).toHaveBeenCalledWith({
      // TotalCount: mockCount[0].total,
      applications: mockApplications,
    });
  });

  it("should return 'No applications found' if no applications are available", async () => {
    // Mock the req and res objects
    const req = { query: { page: "1", limit: "2" } };
    const res = {
      status: jest.fn(() => res),
      send: jest.fn(),
    };
    knex.from.mockResolvedValue([]);

    // Call the controller function
    await getAllApplications(req, res);

    expect(res.send).toHaveBeenCalledWith("No applications found");
  });
});

describe("getApplicationById controller", () => {
  it("should return the application with the given ID", async () => {
    // Mock the req and res objects
    const req = { params: { id: 1 } };
    const res = {
      status: jest.fn(),
      send: jest.fn(),
    };

    // Mock the database query response
    const mockApplication = {
      id: 1,
      name: "App 1",
      description: "Description 1",
    };

    knex.from.mockReturnThis();
    knex.where.mockReturnThis();
    knex.first.mockResolvedValue(mockApplication);

    // Call the controller function
    await getApplicationById(req, res);

    // Expectations
    expect(knex.from).toHaveBeenCalledWith("application");
    expect(knex.where).toHaveBeenCalledWith({ id: 1 });
    expect(knex.first).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(mockApplication);
  });

  it("should return 'The app with the given ID is not found' when application is not found", async () => {
    // Mock the req and res objects
    const req = { params: { id: 1 } };
    const res = {
      status: jest.fn(() => res),
      send: jest.fn(),
    };

    // Set the mock data to be returned by the knex.first function (null for no application found)
    knex.first.mockResolvedValue(null);

    // Call the controller function
    await getApplicationById(req, res);

    // Expectations
    expect(knex.from).toHaveBeenCalledWith("application");
    expect(knex.where).toHaveBeenCalledWith({ id: 1 });
    expect(knex.first).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(
      "The app with the given ID is not found"
    );
  });
});

describe("create application controller", () => {
  it("should create a new application and return it", async () => {
    // Mock the req and res objects
    const req = {
      body: { name: "New App", description: "New App Description" },
    };
    const res = {
      send: jest.fn(),
    };

    // Mock the database query response
    const mockApplication = {
      id: 1,
      name: "New App",
      description: "New App Description",
    };
    knex.returning.mockResolvedValue([mockApplication]);

    // Call the controller function
    await create(req, res);

    // Expectations
    expect(knex.insert).toHaveBeenCalledWith({
      name: "New App",
      description: "New App Description",
    });
    expect(knex.returning).toHaveBeenCalledWith("*");
    expect(res.send).toHaveBeenCalledWith(mockApplication);
  });

  it("should return a CONFLICT status when an application with the same name already exists", async () => {
    // Mock the req and res objects
    const req = {
      body: { name: "Existing App", description: "Existing App Description" },
    };
    const res = {
      status: jest.fn(() => res),
      send: jest.fn(),
    };

    // Set the mock data to be returned by the knex.first function (an existing application with the same name)
    knex.where.mockReturnThis();
    knex.first.mockResolvedValue({
      id: 1,
      name: "Existing App",
      description: "Existing App Description",
    });

    // Call the controller function
    await create(req, res);

    // Expectations
    expect(knex.where).toHaveBeenCalledWith({ name: "Existing App" });
    expect(knex.first).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(StatusCodes.CONFLICT);
    expect(res.send).toHaveBeenCalledWith(
      "An application with the same name already exists"
    );
  });
});

describe("update application controller", () => {
  it("should update an existing application and return it", async () => {
    // Mock the req and res objects
    const req = {
      params: { id: 1 },
      body: { name: "Updated App", description: "Updated App Description" },
    };
    const res = {
      send: jest.fn(),
    };

    // Set the mock data to be returned by the knex.returning function
    const mockApplication = {
      id: 1,
      name: "Updated App",
      description: "Updated App Description",
    };
    knex.from.mockReturnThis();
    knex.where.mockReturnThis();
    knex.whereNot.mockReturnThis();
    knex.first.mockResolvedValueOnce(null); // No conflicting event
    knex.update.mockReturnThis();
    knex.returning.mockResolvedValue([mockApplication]);

    // Call the controller function
    await update(req, res);

    // Expectations
    expect(knex.from).toHaveBeenCalledWith("application");
    expect(knex.where).toHaveBeenCalledWith({ id: 1 });
    expect(knex.whereNot).toHaveBeenCalledWith({ id: 1 });
    expect(knex.update).toHaveBeenCalledWith({
      name: "Updated App",
      description: "Updated App Description",
    });
    expect(knex.returning).toHaveBeenCalledWith("*");
    expect(res.send).toHaveBeenCalledWith(mockApplication);
  });

  it("should return a conflict response if an application with the same name already exists (except for the given application)", async () => {
    const mockRequest = {
      params: { id: 1 },
      body: {
        name: "Updated application",
        description: "Updated Description",
      },
    };

    const mockExistingApplication = {
      id: 2, // Existing event with the same name
      name: "Updated application",
      description: "Existing Event Description",
    };

    // Mock the knex.from, knex.where, knex.whereNot, and knex.first functions
    knex.from.mockReturnThis();
    knex.where.mockReturnThis();
    knex.whereNot.mockReturnThis();
    knex.first.mockResolvedValueOnce(mockExistingApplication); // Return existing event

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await update(mockRequest, mockResponse);

    // Expectations
    expect(knex.from).toHaveBeenCalledWith("application");
    expect(knex.where).toHaveBeenCalledWith({ id: 1 });
    expect(knex.whereNot).toHaveBeenCalledWith({ id: 1 }); // Ensure whereNot is called with the current event ID

    expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.CONFLICT);
    expect(mockResponse.send).toHaveBeenCalledWith(
      "An application with the same name already exists"
    );
  });
});

describe("delete application controller", () => {
  it("should delete an existing application and return it", async () => {
    // Mock the req and res objects
    const req = { params: { id: 1 } };
    const res = {
      send: jest.fn(),
    };

    // Mock the database query response
    const mockApplication = {
      id: 1,
      name: "App 1",
      description: "Description 1",
    };
    knex.where.mockReturnThis();
    knex.first.mockResolvedValue(mockApplication);
    knex.del.mockResolvedValue(1);

    // Call the controller function
    await deleteApplication(req, res);

    // Expectations
    expect(knex.where).toHaveBeenCalledWith({ id: 1 });
    expect(knex.first).toHaveBeenCalled();
    expect(knex.del).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(mockApplication);
  });

  it("should return a 404 status code when the app with the given ID is not found", async () => {
    // Mock the req and res objects
    const req = { params: { id: 2 } };
    const res = {
      status: jest.fn(() => res),
      send: jest.fn(),
    };
    knex.where.mockReturnThis();
    knex.first.mockResolvedValue(null);

    await deleteApplication(req, res);

    // Expectations
    expect(knex.where).toHaveBeenCalledWith({ id: 2 });
    expect(knex.first).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(
      "The app with the given ID is not found"
    );
  });
});
