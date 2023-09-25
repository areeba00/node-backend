/* eslint-disable no-undef */
const { StatusCodes } = require("http-status-codes");
const { getAllMessages } = require("../../db/pg_controllers/messages");
const { getMessageById } = require("../../db/pg_controllers/messages");
const { create } = require("../../db/pg_controllers/messages");
const { delete: deleteMessage } = require("../../db/pg_controllers/messages");
const controller = require("../../db/pg_controllers/messages");
const knex = require("../../db/knex");

// Mock the knex instance
jest.mock("../../db/knex", () => ({
  select: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  from: jest.fn(),
  where: jest.fn(),
  first: jest.fn(),
  whereNot: jest.fn(),
  //   getMissingTagsMock: jest.fn().mockReturnValue([]),
  insert: jest.fn().mockReturnThis(),
  returning: jest.fn(),
  update: jest.fn(),
  del: jest.fn(),
}));

describe("validateMessage function", () => {
  it("should return an error if the applicationName is missing", () => {
    const invalidMessage = {
      eventName: "Test Event",
      notificationTypeName: "Test Notification",
      tags: { tag1: "value1" },
    };

    const result = controller.validateMessage(invalidMessage);

    expect(result.error).toBeDefined();
    expect(result.error.details[0].message).toContain(
      '"applicationName" is required'
    );
  });

  it("should return an error if the eventName is missing", () => {
    const invalidMessage = {
      applicationName: "Test Application",
      notificationTypeName: "Test Notification",
      tags: { tag1: "value1" },
    };

    const result = controller.validateMessage(invalidMessage);

    expect(result.error).toBeDefined();
    expect(result.error.details[0].message).toContain(
      '"eventName" is required'
    );
  });

  it("should return an error if the notificationTypeName is missing", () => {
    const invalidMessage = {
      applicationName: "Test Application",
      eventName: "Test Event",
      tags: { tag1: "value1" },
    };

    const result = controller.validateMessage(invalidMessage);

    expect(result.error).toBeDefined();
    expect(result.error.details[0].message).toContain(
      '"notificationTypeName" is required'
    );
  });

  it("should return an error if the tags object is missing", () => {
    const invalidMessage = {
      applicationName: "Test Application",
      eventName: "Test Event",
      notificationTypeName: "Test Notification",
    };

    const result = controller.validateMessage(invalidMessage);

    expect(result.error).toBeDefined();
    expect(result.error.details[0].message).toContain('"tags" is required');
  });
});

describe("getAllMessages controller", () => {
  it("should return all messages with pagination", async () => {
    const mockRequest = {
      query: {
        page: 2,
        limit: 5,
      },
    };

    const mockMessages = [
      {
        id: 1,
        applicationName: "Test Application 1",
        eventName: "Event 1",
        notificationTypeName: "Notification 1",
        tags: { body: "Test body 1" },
      },
      {
        id: 2,
        applicationName: "Test Application 2",
        eventName: "Event 2",
        notificationTypeName: "Notification 2",
        tags: { body: "Test body 2" },
      },
      // Add more mock messages if needed
    ];

    // Mock the knex.select, knex.offset, knex.limit, and knex.from functions
    knex.select.mockReturnThis();
    knex.offset.mockReturnThis();
    knex.limit.mockReturnThis();
    knex.from.mockResolvedValueOnce(mockMessages);

    const mockResponse = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await getAllMessages(mockRequest, mockResponse);

    // Expectations
    expect(knex.select).toHaveBeenCalledWith();
    expect(knex.offset).toHaveBeenCalledWith(5);
    expect(knex.limit).toHaveBeenCalledWith(5);
    expect(knex.from).toHaveBeenCalledWith("message");
    expect(mockResponse.send).toHaveBeenCalledWith(mockMessages);
  });

  it("should return a 'Not Found' response if there are no messages", async () => {
    const mockRequest = {
      query: {
        page: 1,
        limit: 10,
      },
    };

    // Mock the knex.select, knex.offset, knex.limit, and knex.from functions
    knex.select.mockReturnThis();
    knex.offset.mockReturnThis();
    knex.limit.mockReturnThis();
    knex.from.mockResolvedValueOnce([]); // Empty array for no messages

    const mockResponse = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await getAllMessages(mockRequest, mockResponse);

    // Expectations
    expect(knex.select).toHaveBeenCalledWith();
    expect(knex.offset).toHaveBeenCalledWith(0); // Offset should be 0 for the first page
    expect(knex.limit).toHaveBeenCalledWith(10);
    expect(knex.from).toHaveBeenCalledWith("message");
    expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
    expect(mockResponse.send).toHaveBeenCalledWith("No messages found");
  });
});

describe("getMessageById controller", () => {
  it("should return the message with the given ID if it exists", async () => {
    const mockRequest = {
      params: { id: 1 },
    };

    const mockMessage = {
      id: 1,
      applicationName: "Test Application",
      eventName: "Event 1",
      notificationTypeName: "Notification 1",
      tags: { body: "Test body" },
    };

    // Mock the knex.where and knex.first functions
    knex.from.mockReturnThis();
    knex.where.mockReturnThis();
    knex.first.mockResolvedValue(mockMessage);

    const mockResponse = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await getMessageById(mockRequest, mockResponse);

    // Expectations
    expect(knex.from).toHaveBeenCalledWith("message");
    expect(knex.where).toHaveBeenCalledWith({ id: 1 });
    expect(knex.first).toHaveBeenCalledWith();
    expect(mockResponse.send).toHaveBeenCalledWith(mockMessage);
  });

  it("should return a 'Not Found' response if the message with the given ID does not exist", async () => {
    const mockRequest = {
      params: { id: 1 },
    };

    // Mock the knex.where and knex.first functions
    knex.from.mockReturnThis();
    knex.where.mockReturnThis();
    knex.first.mockResolvedValueOnce(undefined); // No message found

    const mockResponse = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await getMessageById(mockRequest, mockResponse);

    // Expectations
    expect(knex.from).toHaveBeenCalledWith("message");
    expect(knex.where).toHaveBeenCalledWith({ id: 1 });
    expect(knex.first).toHaveBeenCalledWith();
    expect(mockResponse.send).toHaveBeenCalledWith(
      "The message with the given ID is not found"
    );
  });
});

describe("deleteMessage controller", () => {
  it("should delete the message with the given ID and return the deleted message", async () => {
    const mockRequest = {
      params: { id: 1 },
    };

    const mockDeletedMessage = {
      id: 1,
      applicationName: "Test Application",
      eventName: "Event 1",
      notificationTypeName: "Notification 1",
      tags: { body: "Test body" },
    };

    // Mock the knex.where, knex.del, and knex.returning functions
    knex.where.mockReturnThis();
    knex.first.mockResolvedValue(mockDeletedMessage);
    knex.del.mockResolvedValue(1); // Return deleted message

    const mockResponse = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await deleteMessage(mockRequest, mockResponse);

    // Expectations
    expect(knex.where).toHaveBeenCalledWith({ id: 1 });
    expect(knex.first).toHaveBeenCalled();
    expect(knex.del).toHaveBeenCalled();
    expect(mockResponse.send).toHaveBeenCalledWith(mockDeletedMessage);
  });

  it("should return a 'Not Found' response if the message with the given ID does not exist", async () => {
    const mockRequest = {
      params: { id: 2 },
    };

    // Mock the knex.where, knex.del, and knex.returning functions
    knex.where.mockReturnThis();
    knex.first.mockResolvedValue(null);

    const mockResponse = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await deleteMessage(mockRequest, mockResponse);

    // Expectations
    expect(knex.where).toHaveBeenCalledWith({ id: 2 });
    expect(knex.first).toHaveBeenCalled();
    expect(mockResponse.send).toHaveBeenCalledWith(
      "The message with the given ID is not found"
    );
  });
});

describe("createMessage controller", () => {
  it("should create a new message with the provided data", async () => {
    const mockRequest = {
      body: {
        applicationName: "Test Application",
        eventName: "Test Event",
        notificationTypeName: "Test Notification Type",
        tags: {
          tag1: "value1",
          tag2: "value2",
        },
      },
    };

    const mockApplication = {
      id: 1,
      name: "Test Application",
      description: "Test Application Description",
    };

    const mockEvent = {
      id: 2,
      name: "Test Event",
      description: "Test Event Description",
      application_id: 1,
    };

    const mockNotificationType = {
      id: 3,
      name: "Test Notification Type",
      template_body: "Hello {tag1}, this is a {tag2}.",
      event_id: 2,
    };

    // Mock the knex.where and knex.first functions for application, event, and notificationType
    knex.from.mockReturnThis();
    knex.where.mockReturnThis();
    knex.first.mockResolvedValueOnce(mockApplication);
    knex.first.mockResolvedValueOnce(mockEvent);
    knex.first.mockResolvedValueOnce(mockNotificationType);

    // Mock the knex.insert and knex.returning functions for creating the message
    const mockCreatedMessage = {
      id: 4,
      text: "Hello value1, this is a value2.",
      notificationType_id: 3,
    };
    knex.insert.mockReturnThis();
    knex.returning.mockResolvedValueOnce([mockCreatedMessage]);
    // controller.getMissingTags = getMissingTagsMock;
    const mockResponse = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await create(mockRequest, mockResponse);

    // Expectations
    expect(knex.from).toHaveBeenCalledWith("application");
    expect(knex.where).toHaveBeenCalledWith({ name: "Test Application" });
    expect(knex.first).toHaveBeenCalledWith();

    expect(knex.from).toHaveBeenCalledWith("event");
    expect(knex.where).toHaveBeenCalledWith({
      name: "Test Event",
      application_id: 1,
    });
    expect(knex.first).toHaveBeenCalledWith();

    expect(knex.from).toHaveBeenCalledWith("notificationType");
    expect(knex.where).toHaveBeenCalledWith({
      name: "Test Notification Type",
      event_id: 2,
    });
    expect(knex.first).toHaveBeenCalledWith();
    expect(knex.insert).toHaveBeenCalledWith({
      text: "Hello value1, this is a value2.",
      notificationType_id: 3,
    });

    expect(knex.returning).toHaveBeenCalledWith("*");
    expect(mockResponse.send).toHaveBeenCalledWith(mockCreatedMessage);
  });
});
