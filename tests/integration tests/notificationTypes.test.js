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
  await knex("notificationType").where({ name: "New notification" }).del();
  await knex("notificationType").where({ name: "Test notification" }).del();
  await knex("notificationType").where({ name: "Existing notification" }).del();
  server.close();
});

describe("GET /api/notificationTypes", () => {
  it("should return a list of notificationTypes with pagination", async () => {
    const response = await request(server)
      .get("/api/notifications")
      .set("x-auth-token", token)
      .query({ page: 1, limit: 2 });
    expect(response.status).toBe(StatusCodes.OK);
  });
});

describe("GET /api/notification/:id", () => {
  it("should return the event with the given ID", async () => {
    const response = await request(server)
      .get("/api/notifications/37")
      .set("x-auth-token", token);

    expect(response.status).toBe(200);
    expect(response.body.id).toBeDefined();
  });
});

describe("POST /api/notifications", () => {
  it("should create a new notification", async () => {
    const newNotification = {
      name: "New notification",
      description: "New notification Description",
      template_subject: "subject",
      template_body: "{body}",
      event_id: 362,
    };

    const response = await request(server)
      .post("/api/notifications")
      .set("x-auth-token", token)
      .send(newNotification)
      .expect(StatusCodes.OK);

    // Verify that the response matches the provided data
    expect(response.body).toMatchObject(newNotification);
    expect(response.body.id).toBeDefined();
  });

  it("should return 409 Conflict if an notification with the same name exists for the event", async () => {
    //   Insert a conflicting event into the database
    await knex("notificationType").insert({
      name: "Test notification",
      description: "New notification Description",
      template_subject: "subject",
      template_body: "{body}",
      event_id: 362,
    });

    const response = await request(server)
      .post("/api/notifications")
      .set("x-auth-token", token)
      .send({
        name: "Test notification",
        description: "New notification Description",
        template_subject: "subject",
        template_body: "{body}",
        event_id: 362,
      });

    expect(response.status).toBe(409);
  });

  it("should return 404 Not Found if the specified event does not exist", async () => {
    const response = await request(server)
      .post("/api/notifications")
      .set("x-auth-token", token)
      .send({
        name: "New notification",
        description: "New notification Description",
        template_subject: "subject",
        template_body: "{body}",
        event_id: 9999,
      });

    expect(response.status).toBe(404);
    expect(response.text).toBe("Event not found");
  });
});

describe("PUT /api/notifications", () => {
  it("should return 409 Conflict if a notification with the same name exists for the event", async () => {
    // Insert a conflicting notification into the database
    await knex("notificationType").insert({
      name: "Test notification",
      description: "New notification Description",
      template_subject: "subject",
      template_body: "{body}",
      event_id: 362,
    });
    const response = await request(server)
      .put("/api/notifications/37")
      .set("x-auth-token", token)
      .send({
        name: "Test notification",
        description: "New notification Description",
        template_subject: "subject",
        template_body: "{body}",
        event_id: 362,
      });

    expect(response.status).toBe(409);
    expect(response.text).toBe(
      "A notification with the same name already exists for the event"
    );
  });

  it("should return 404 Not Found if the specified event does not exist", async () => {
    const response = await request(server)
      .post("/api/notifications")
      .set("x-auth-token", token)
      .send({
        name: "Test Event",
        description: "Test Description",
        template_subject: "subject",
        template_body: "{body}",
        event_id: 9999,
      });

    expect(response.status).toBe(404);
    expect(response.text).toBe("Event not found");
  });

  it("should update existing notification", async () => {
    const newNotification = {
      name: "Updated notification",
      description: "New notification Description",
      template_subject: "subject",
      template_body: "{body}",
      event_id: 362,
    };

    const response = await request(server)
      .put("/api/notifications/37")
      .set("x-auth-token", token)
      .send(newNotification)
      .expect(StatusCodes.OK);

    // Verify that the response matches the provided data
    expect(response.body).toMatchObject(newNotification);
    expect(response.body.id).toBeDefined();
  });
});

describe("DELETE /api/notifications", () => {
  it("should delete an existing notification", async () => {
    // Insert a test application into the database
    const existingNotification = {
      name: "Existing notification",
      description: "Existing",
      template_subject: "subject",
      template_body: "{body}",
      event_id: 362,
    };
    const insertedNotification = await knex("notificationType")
      .insert(existingNotification)
      .returning("*");

    const response = await request(server)
      .delete(`/api/notifications/${insertedNotification[0].id}`)
      .set("x-auth-token", token)
      .expect(StatusCodes.OK);

    expect(response.body).toMatchObject(existingNotification);
  });
});
