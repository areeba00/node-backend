/* eslint-disable no-underscore-dangle */
/* eslint-disable global-require */
/* eslint-disable no-undef */
const request = require("supertest");
const { StatusCodes } = require("http-status-codes");
const knex = require("../../db/knex");

let server;
let token;
beforeAll(async () => {
  server = require("../../index");
  token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOjksImlhdCI6MTY4OTQ0NDYyN30.f_T5EbG_WVWrYi4VuBpJs1iCPg5aMPIuGcJDmXR6yC4";
});

afterAll(async () => {
  await knex("message").where({ text: "test" }).del();
  server.close();
});

describe("GET /api/messages", () => {
  it("should return a list of messages with pagination", async () => {
    const response = await request(server)
      .get("/api/messages")
      .set("x-auth-token", token)
      .query({ page: 1, limit: 2 });
    expect(response.status).toBe(StatusCodes.OK);
  });
});

describe("GET /api/messages/:id", () => {
  it("should return the message with the given ID", async () => {
    const response = await request(server)
      .get("/api/messages/1")
      .set("x-auth-token", token);

    expect(response.status).toBe(200);
    expect(response.body.id).toBeDefined();
  });

  it("should return 404 Not Found if the message with the given ID is not found", async () => {
    const nonExistentEventId = 999999;

    const response = await request(server)
      .get(`/api/messages/${nonExistentEventId}`)
      .set("x-auth-token", token);

    expect(response.status).toBe(404);
    expect(response.text).toBe("The message with the given ID is not found");
  });
});

describe("POST /api/messages", () => {
  it("should return 404 Not Found if the application with the given name does not exist", async () => {
    const messageData = {
      applicationName: "NonExistingApplication",
      eventName: "EventName",
      notificationTypeName: "NotificationType",
      tags: { body: "test" },
    };

    const response = await request(server)
      .post("/api/messages")
      .set("x-auth-token", token)
      .send(messageData)
      .expect(404);

    expect(response.text).toBe("Application not found");
  });

  it("should return 404 Not Found if the event with the given name does not exist for the application", async () => {
    const messageData = {
      applicationName: "test Application",
      eventName: "NonExistingEvent",
      notificationTypeName: "NotificationType",
      tags: { body: "test" },
    };

    const response = await request(server)
      .post("/api/messages")
      .set("x-auth-token", token)
      .send(messageData)
      .expect(404);

    expect(response.text).toBe("Event not found for the given application");
  });

  it("should return 404 Not Found if the notification type with the given name does not exist for the event", async () => {
    const messageData = {
      applicationName: "test Application",
      eventName: "Updated",
      notificationTypeName: "NonExistingNotificationType",
      tags: { body: "test" },
    };

    const response = await request(server)
      .post("/api/messages")
      .set("x-auth-token", token)
      .send(messageData)
      .expect(404);

    expect(response.text).toBe(
      "Notification type not found for the given event"
    );
  });

  it("should return 400 Bad Request if tags are incomplete", async () => {
    const messageData = {
      applicationName: "test Application",
      eventName: "Updated",
      notificationTypeName: "Updated notification",
      tags: {}, // Missing tag2
    };

    const response = await request(server)
      .post("/api/messages")
      .set("x-auth-token", token)
      .send(messageData)
      .expect(400);

    expect(response.text).toBe("Tags are incomplete. Missing tags: body");
  });

  it("should create a new message", async () => {
    const newMessage = {
      applicationName: "test Application",
      eventName: "Updated",
      notificationTypeName: "Updated notification",
      tags: {
        body: "test",
      },
    };

    const response = await request(server)
      .post("/api/messages")
      .set("x-auth-token", token)
      .send(newMessage)
      .expect(StatusCodes.OK);

    expect(response.body.id).toBeDefined();
  });
});

describe("DELETE /api/messages", () => {
  it("should delete an existing message", async () => {
    // Insert a test message into the database
    const existingMessage = {
      text: "Test message",
      notificationType_id: 37,
    };
    const insertedMessage = await knex("message")
      .insert(existingMessage)
      .returning("*");

    const response = await request(server)
      .delete(`/api/messages/${insertedMessage[0].id}`)
      .set("x-auth-token", token)
      .expect(StatusCodes.OK);

    expect(response.body).toMatchObject(existingMessage);

    // Delete the inserted record from the database
    await knex("message").where({ id: insertedMessage[0].id }).del();
  });
});
