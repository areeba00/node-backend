/* eslint-disable no-undef */
const { StatusCodes } = require("http-status-codes");
const { getAllEvents } = require("../../db/pg_controllers/events");
const { getEventById } = require("../../db/pg_controllers/events");
const { create } = require("../../db/pg_controllers/events");
const { update } = require("../../db/pg_controllers/events");
const { delete: deleteEvent } = require("../../db/pg_controllers/events");
const knex = require("../../db/knex");
const controller = require("../../db/pg_controllers/events");
// Mock the knex instance
jest.mock("../../db/knex", () => ({
  select: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  from: jest.fn(),
  where: jest.fn(),
  first: jest.fn(),
  whereNot: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  returning: jest.fn(),
  update: jest.fn(),
  del: jest.fn(),
}));

describe("validateEvent function", () => {
  it("should return an error if the event name is less than 3 characters", () => {
    const invalidEvent = {
      name: "Ev", // Less than 3 characters
      description: "Test Description",
      application_id: 1,
      isActive: true,
    };

    const result = controller.validateEvent(invalidEvent);

    expect(result.error).toBeDefined();
    expect(result.error.details[0].message).toContain(
      '"name" length must be at least 3 characters long'
    );
  });

  it("should return an error if the description is less than 5 characters", () => {
    const invalidEvent = {
      name: "Valid Event",
      description: "Test", // Less than 5 characters
      application_id: 1,
      isActive: true,
    };

    const result = controller.validateEvent(invalidEvent);

    expect(result.error).toBeDefined();
    expect(result.error.details[0].message).toContain(
      '"description" length must be at least 5 characters long'
    );
  });

  it("should return an error if the application_id is missing", () => {
    const invalidEvent = {
      name: "Valid Event",
      description: "Test Description",
      isActive: true,
    };

    const result = controller.validateEvent(invalidEvent);

    expect(result.error).toBeDefined();
    expect(result.error.details[0].message).toContain(
      '"application_id" is required'
    );
  });

  it("should return an error if the application_id is not a number", () => {
    const invalidEvent = {
      name: "Valid Event",
      description: "Test Description",
      application_id: "invalid", // Not a number
      isActive: true,
    };

    const result = controller.validateEvent(invalidEvent);

    expect(result.error).toBeDefined();
    expect(result.error.details[0].message).toContain(
      '"application_id" must be a number'
    );
  });
});

describe("getAllEvents controller", () => {
  it("should return a list of events with pagination and filters", async () => {
    // Mock the req and res objects
    const req = {
      query: { page: "1", limit: "10", isActive: true, application_id: 2 },
    };
    const res = {
      status: jest.fn(() => res),
      send: jest.fn(),
    };

    // Mock the database query response
    const mockEvents = [
      {
        id: 1,
        name: "Event 1",
        description: "Description 1",
        isActive: true,
        application_id: 2,
      },
      { id: 2, name: "Event 2", description: "Description 2" },
    ];
    const mockCount = [{ total: 1 }];

    // Clone the req.query object and delete page and limit properties
    const query = { ...req.query };
    delete query.page;
    delete query.limit;

    knex.count = jest.fn().mockReturnThis(mockCount);
    knex.where = jest.fn().mockReturnThis();
    knex.from = jest.fn().mockReturnThis();
    knex.select = jest.fn().mockReturnThis();
    knex.offset = jest.fn().mockReturnThis();
    knex.limit = jest.fn().mockReturnThis();
    knex.where = jest.fn().mockReturnThis();
    knex.from.mockResolvedValue(mockEvents);

    // Call the controller function
    await getAllEvents(req, res);

    // Expectations
    expect(knex.count).toHaveBeenCalled();
    expect(knex.where).toHaveBeenCalledWith(query);
    expect(knex.from).toHaveBeenCalled();
    expect(knex.select).toHaveBeenCalled();
    expect(knex.offset).toHaveBeenCalledWith(0);
    expect(knex.limit).toHaveBeenCalledWith(10);
    expect(knex.where).toHaveBeenCalledWith(query);
    expect(knex.from).toHaveBeenCalledWith("event");
    expect(res.send).toHaveBeenCalledWith({
      // TotalCount: mockCount[0].total,
      events: mockEvents,
    });
  });

  it("should return 'No events found' when no events are available", async () => {
    // Mock the req and res objects
    const req = { query: { page: "1", limit: "2" } };
    const res = {
      status: jest.fn(() => res),
      send: jest.fn(),
    };

    knex.from.mockResolvedValue([]);

    await getAllEvents(req, res);

    expect(res.send).toHaveBeenCalledWith("No events found");
  });
});

describe("getEventById controller", () => {
  it("should return the event with the given ID", async () => {
    const req = { params: { id: 1 } };
    const res = {
      status: jest.fn(),
      send: jest.fn(),
    };

    const mockEvent = {
      id: 1,
      name: "event 1",
      description: "Description 1",
    };

    knex.from.mockReturnThis();
    knex.where.mockReturnThis();
    knex.first.mockResolvedValue(mockEvent);
    await getEventById(req, res);

    // Expectations
    expect(knex.from).toHaveBeenCalledWith("event");
    expect(knex.where).toHaveBeenCalledWith({ id: 1 });
    expect(knex.first).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(mockEvent);
  });

  it("should return 'The event with the given ID is not found' when event is not found", async () => {
    const req = { params: { id: 1 } };
    const res = {
      status: jest.fn(() => res),
      send: jest.fn(),
    };

    knex.first.mockResolvedValue(null);

    await getEventById(req, res);

    // Expectations
    expect(knex.from).toHaveBeenCalledWith("event");
    expect(knex.where).toHaveBeenCalledWith({ id: 1 });
    expect(knex.first).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(
      "The event with the given ID is not found"
    );
  });
});

describe("create event controller", () => {
  it("should create a new event and return it", async () => {
    const mockRequest = {
      body: {
        name: "Event 1",
        description: "Description 1",
        application_id: 1,
      },
    };

    const mockExistingEvent = null;
    const mockApplication = {
      id: 1,
      name: "App 1",
      description: "App Description",
    };

    const mockNewEvent = {
      id: 1,
      name: "Event 1",
      description: "Description 1",
      application_id: 1,
    };

    knex.from.mockReturnThis();
    knex.where.mockReturnThis();
    knex.first.mockResolvedValueOnce(mockExistingEvent);
    knex.first.mockResolvedValueOnce(mockApplication);
    knex.insert.mockReturnThis();
    knex.returning.mockResolvedValue([mockNewEvent]);

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await create(mockRequest, mockResponse);

    // Expectations
    expect(knex.from).toHaveBeenCalledWith("event");
    expect(knex.where).toHaveBeenCalledWith({
      name: "Event 1",
      application_id: 1,
    });
    expect(knex.first).toHaveBeenCalledWith();
    expect(knex.first).toHaveBeenCalledWith();
    expect(knex.insert).toHaveBeenCalledWith({
      name: "Event 1",
      description: "Description 1",
      application_id: 1,
    });
    expect(knex.returning).toHaveBeenCalledWith("*");
    expect(mockResponse.send).toHaveBeenCalledWith(mockNewEvent);
  });
});

describe("update event controller", () => {
  it("should return a conflict response if an event with the same name already exists (except for the given event)", async () => {
    const mockRequest = {
      params: { id: 1 },
      body: {
        name: "Updated Event",
        description: "Updated Description",
        application_id: 2,
      },
    };

    const mockExistingEvent = {
      id: 2, // Existing event with the same name
      name: "Updated Event",
      description: "Existing Event Description",
      application_id: 2,
    };

    // Mock the knex.from, knex.where, knex.whereNot, and knex.first functions
    knex.from.mockReturnThis();
    knex.where.mockReturnThis();
    knex.whereNot.mockReturnThis();
    knex.first.mockResolvedValueOnce(mockExistingEvent); // Return existing event

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await update(mockRequest, mockResponse);

    // Expectations
    expect(knex.from).toHaveBeenCalledWith("event");
    expect(knex.where).toHaveBeenCalledWith({ id: 1 });
    expect(knex.whereNot).toHaveBeenCalledWith({ id: 1 }); // Ensure whereNot is called with the current event ID

    expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.CONFLICT);
    expect(mockResponse.send).toHaveBeenCalledWith(
      "An event with the same name already exists for the application"
    );
  });

  it("should update the event", async () => {
    const mockRequest = {
      params: { id: 1 },
      body: {
        name: "Updated Event",
        description: "Updated Description",
        application_id: 2,
        isActive: true,
      },
    };

    const mockApplication = {
      id: 2,
      name: "Test Application",
      description: "Application Description",
    };

    const mockUpdatedEvent = {
      id: 1,
      name: "Updated Event",
      description: "Updated Description",
      application_id: 2,
      isActive: true,
    };

    // Mock the knex.from, knex.where, knex.whereNot, and knex.update functions
    knex.from.mockReturnThis();
    knex.where.mockReturnThis();
    knex.whereNot.mockReturnThis();
    knex.first.mockResolvedValueOnce(null); // No conflicting event
    knex.first.mockResolvedValueOnce(mockApplication); // Return application for application_id check
    knex.update.mockReturnThis();
    knex.returning.mockResolvedValueOnce([mockUpdatedEvent]); // Return updated event

    const mockResponse = {
      send: jest.fn(),
    };

    await update(mockRequest, mockResponse);

    // Expectations
    expect(knex.from).toHaveBeenCalledWith("event");
    expect(knex.where).toHaveBeenCalledWith({ id: 1 });
    expect(knex.whereNot).toHaveBeenCalledWith({ id: 1 }); // Ensure whereNot is called with the current event ID
    expect(knex.update).toHaveBeenCalledWith({
      name: "Updated Event",
      description: "Updated Description",
      application_id: 2,
      isActive: true,
    });
    expect(knex.returning).toHaveBeenCalledWith("*");
    expect(mockResponse.send).toHaveBeenCalledWith(mockUpdatedEvent);
  });
});

describe("delete event controller", () => {
  it("should delete an existing event and return it", async () => {
    const req = { params: { id: 1 } };
    const res = {
      send: jest.fn(),
    };

    // Mock the deleted event
    const mockDeletedEvent = {
      id: 1,
      name: "Deleted Event",
      description: "Deleted Description",
      application_id: 2,
    };

    knex.where.mockReturnThis();
    knex.first.mockResolvedValue(mockDeletedEvent);
    knex.del.mockResolvedValue(1);

    await deleteEvent(req, res);

    // Expectations
    expect(knex.where).toHaveBeenCalledWith({ id: 1 });
    expect(knex.first).toHaveBeenCalled();
    expect(knex.del).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(mockDeletedEvent);
  });

  it("should return a 404 status code when the event with the given ID is not found", async () => {
    // Mock the req and res objects
    const req = { params: { id: 2 } };
    const res = {
      status: jest.fn(() => res),
      send: jest.fn(),
    };
    knex.where.mockReturnThis();
    knex.first.mockResolvedValue(null);

    await deleteEvent(req, res);

    // Expectations
    expect(knex.where).toHaveBeenCalledWith({ id: 2 });
    expect(knex.first).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(
      "The event with the given ID is not found"
    );
  });
});
