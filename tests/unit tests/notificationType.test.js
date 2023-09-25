/* eslint-disable no-undef */
const { StatusCodes } = require("http-status-codes");
const {
  getAllNotifications,
} = require("../../db/pg_controllers/notificationType");
const {
  getNotificationById,
} = require("../../db/pg_controllers/notificationType");
const { create } = require("../../db/pg_controllers/notificationType");
const { update } = require("../../db/pg_controllers/notificationType");
const {
  delete: deleteNotification,
} = require("../../db/pg_controllers/notificationType");
const knex = require("../../db/knex");
// const controller = require("../../db/pg_controllers/notificationType");

// Mock the knex instance
jest.mock("../../db/knex", () => ({
  select: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  from: jest.fn(),
  where: jest.fn(),
  first: jest.fn(),
  whereNot: jest.fn(),
  extractAndAssociateTags: jest.fn().mockResolvedValue(["tag1", "tag2"]),
  insert: jest.fn().mockReturnThis(),
  returning: jest.fn(),
  update: jest.fn(),
  del: jest.fn(),
}));

describe("getNotificationTypes controller", () => {
  it("should return a list of notification types with pagination", async () => {
    // Mock the req and res objects
    const req = { query: { page: "1", limit: "2" } };
    const res = {
      status: jest.fn(() => res),
      send: jest.fn(),
    };

    // Mock the database query response
    const mockNotificationTypes = [
      { id: 1, name: "Notification Type 1", description: "Description 1" },
      { id: 2, name: "Notification Type 2", description: "Description 2" },
    ];

    // Set the mock data to be returned by the knex.from function
    knex.from.mockResolvedValue(mockNotificationTypes);

    // Call the controller function
    await getAllNotifications(req, res);

    // Expectations
    expect(knex.select).toHaveBeenCalled();
    expect(knex.offset).toHaveBeenCalledWith(0);
    expect(knex.limit).toHaveBeenCalledWith(2);
    expect(knex.from).toHaveBeenCalledWith("notificationType");
    expect(res.send).toHaveBeenCalledWith(mockNotificationTypes);
  });

  it("should return 'No notification types found' when no notification types are available", async () => {
    // Mock the req and res objects
    const req = { query: { page: "1", limit: "2" } };
    const res = {
      status: jest.fn(() => res),
      send: jest.fn(),
    };

    knex.from.mockResolvedValue([]);

    await getAllNotifications(req, res);

    expect(res.send).toHaveBeenCalledWith("No notification types found");
  });
});

describe("getNotificationById controller", () => {
  it("should return the notification with the provided ID", async () => {
    // Mock the req and res objects
    const req = { params: { id: 1 } };
    const res = {
      status: jest.fn(() => res),
      send: jest.fn(),
    };

    // Mock the database query response
    const mockNotification = {
      id: 1,
      name: "Notification Type 1",
      description: "Description 1",
    };

    knex.from.mockReturnThis();
    knex.where.mockReturnThis();
    knex.first.mockResolvedValue(mockNotification);

    // Call the controller function
    await getNotificationById(req, res);

    // Expectations
    expect(knex.from).toHaveBeenCalledWith("notificationType");
    expect(knex.where).toHaveBeenCalledWith({ id: 1 });
    expect(knex.first).toHaveBeenCalledWith();
    expect(res.send).toHaveBeenCalledWith(mockNotification);
  });

  it("should return 'The notification with the given ID is not found' when the ID does not match any notification", async () => {
    // Mock the req and res objects
    const req = { params: { id: 999 } };
    const res = {
      status: jest.fn(() => res),
      send: jest.fn(),
    };

    knex.first.mockResolvedValue(null);

    // Call the controller function
    await getNotificationById(req, res);

    // Expectations
    expect(knex.from).toHaveBeenCalledWith("notificationType");
    expect(knex.where).toHaveBeenCalledWith({ id: 999 });
    expect(knex.first).toHaveBeenCalledWith();
    expect(res.send).toHaveBeenCalledWith(
      "The notification with the given ID is not found"
    );
  });
});

describe("create controller", () => {
  it("should create a new notification with the provided data", async () => {
    // Mock the req and res objects
    const req = {
      body: {
        event_id: 1,
        name: "New Notification",
        description: "New Notification Description",
        template_subject: "Subject",
        template_body: "Body with {tag1} and {tag2}",
      },
    };
    const res = {
      send: jest.fn(),
    };

    // Mock the database query responses
    const mockExistingEvent = { id: 1, name: "Existing Event" };
    const mockExistingNotification = null;
    const mockTags = ["tag1", "tag2"];
    const mockInsertedNotification = {
      id: 2,
      name: "New Notification",
      description: "New Notification Description",
      template_subject: "Subject",
      template_body: "Body with {tag1} and {tag2}",
      event_id: 1,
      tags: mockTags,
    };

    // Mock the extractAndAssociateTags function
    knex.extractAndAssociateTags.mockResolvedValue(mockTags);

    // Mock the database insertion
    knex.from.mockReturnThis();
    knex.where.mockReturnThis();
    knex.first.mockResolvedValueOnce(mockExistingEvent);
    knex.first.mockResolvedValueOnce(mockExistingNotification);
    knex.insert.mockReturnValue({
      returning: jest.fn().mockResolvedValue([mockInsertedNotification]),
    });

    // Call the controller function, passing the mocked extractAndAssociateTags function
    await create(req, res);

    expect(knex.from).toHaveBeenCalledWith("notificationType");
    expect(knex.where).toHaveBeenCalledWith({ id: 1 });
    expect(knex.first).toHaveBeenCalledWith();
    expect(knex.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "New Notification",
        description: "New Notification Description",
        template_subject: "Subject",
        template_body: "Body with {tag1} and {tag2}",
        event_id: 1,
        tags: ["tag1", "tag2"],
      })
    );
    expect(res.send).toHaveBeenCalledWith(mockInsertedNotification);
  });

  it("should return 'Event not found' when the provided event_id does not match any existing event", async () => {
    // Mock the req and res objects
    const req = {
      body: {
        event_id: 999, // Non-existent event_id
        name: "New Notification",
        description: "New Notification Description",
        template_subject: "Subject",
        template_body: "Body with {tag1} and {tag2}",
      },
    };
    const res = {
      status: jest.fn(() => res),
      send: jest.fn(),
    };

    // Set the mock data to simulate no existing event for the provided event_id
    knex.first.mockResolvedValue(null);

    // Call the controller function
    await create(req, res);

    // Expectations
    expect(knex.where).toHaveBeenCalledWith({ id: 999 });
    expect(knex.first).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
    expect(res.send).toHaveBeenCalledWith("Event not found");
  });

  it("should return 'A notification with the same name already exists for the event' when a notification with the same name already exists for the provided event_id", async () => {
    // Mock the req and res objects
    const req = {
      body: {
        event_id: 1,
        name: "Existing Notification", // Notification with the same name already exists
        description: "New Notification Description",
        template_subject: "Subject",
        template_body: "Body with {tag1} and {tag2}",
      },
    };
    const res = {
      status: jest.fn(() => res),
      send: jest.fn(),
    };

    // Mock the database query response
    const mockExistingEvent = { id: 1, name: "Existing Event" };
    const mockExistingNotification = {
      id: 3,
      name: "Existing Notification",
      event_id: 1,
    };
    knex.first.mockResolvedValueOnce(mockExistingEvent);
    knex.first.mockResolvedValueOnce(mockExistingNotification);

    // Call the controller function
    await create(req, res);

    // Expectations
    expect(knex.where).toHaveBeenCalledWith({ id: 1 });
    expect(knex.first).toHaveBeenCalledWith();
    expect(res.send).toHaveBeenCalledWith(
      "A notification with the same name already exists for the event"
    );
  });
});

describe("update controller", () => {
  it("should update the notification with the provided data", async () => {
    // Mock the req and res objects
    const req = {
      params: { id: 1 },
      body: {
        event_id: 1,
        name: "Updated Notification",
        description: "Updated Notification Description",
        template_subject: "Subject",
        template_body: "Body with {tag1} and {tag2}",
      },
    };
    const res = {
      send: jest.fn(),
    };

    // Mock the database query responses
    const mockExistingEvent = { id: 1, name: "Existing Event" };
    const mockExistingNotification = {
      id: 1,
      name: "Old Notification",
      description: "Old Description",
      event_id: 1,
      template_subject: "Old Subject",
      template_body: "Old Body",
    };
    const mockTags = ["tag1", "tag2"];
    const mockUpdatedNotification = {
      id: 1,
      name: "Updated Notification",
      description: "Updated Notification Description",
      template_subject: "Subject",
      template_body: "Body with {tag1} and {tag2}",
      event_id: 1,
      tags: mockTags,
    };

    // Mock the extractAndAssociateTags function
    knex.extractAndAssociateTags.mockResolvedValue(mockTags);

    // Mock the database update
    knex.from.mockReturnThis();
    knex.where.mockReturnThis();
    knex.first.mockResolvedValueOnce(mockExistingEvent);
    knex.whereNot.mockReturnThis();
    knex.first.mockResolvedValueOnce(null);
    knex.first.mockResolvedValueOnce(mockExistingNotification);
    knex.update.mockReturnValue({
      returning: jest.fn().mockResolvedValue([mockUpdatedNotification]),
    });

    // Call the controller function, passing the mocked extractAndAssociateTags function
    await update(req, res);

    expect(knex.from).toHaveBeenCalledWith("notificationType");
    expect(knex.where).toHaveBeenCalledWith({ id: 1 });
    expect(knex.whereNot).toHaveBeenCalledWith({ id: 1 });
    expect(knex.update).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Updated Notification",
        description: "Updated Notification Description",
        template_subject: "Subject",
        template_body: "Body with {tag1} and {tag2}",
        event_id: 1,
        tags: ["tag1", "tag2"],
      })
    );
    expect(res.send).toHaveBeenCalledWith(mockUpdatedNotification);
  });
});

describe("delete controller", () => {
  it("should delete the notification with the given ID and return it", async () => {
    const req = {
      params: { id: 1 },
    };
    const res = {
      send: jest.fn(),
    };

    const mockDeletedNotification = {
      id: 1,
      name: "Deleted Notification",
      description: "Description of Deleted Notification",
      template_subject: "Subject",
      template_body: "Body with {tag1} and {tag2}",
    };

    knex.where.mockReturnThis();
    knex.first.mockResolvedValue(mockDeletedNotification);
    knex.del.mockResolvedValue(1);

    await deleteNotification(req, res);

    expect(knex.where).toHaveBeenCalledWith({ id: 1 });
    expect(knex.first).toHaveBeenCalled();
    expect(knex.del).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(mockDeletedNotification);
  });

  it("should return 'The notification with the given ID is not found' when the notification with the given ID does not exist", async () => {
    const req = {
      params: { id: 2 }, // Non-existent notification ID
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    knex.where.mockReturnThis();
    knex.first.mockResolvedValue(null);

    await deleteNotification(req, res);

    expect(knex.where).toHaveBeenCalledWith({ id: 2 });
    expect(knex.first).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(
      "The notification with the given ID is not found"
    );
  });
});
