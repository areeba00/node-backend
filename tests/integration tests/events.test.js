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
  await knex("event").insert([
    { id: 1, name: "event", description: "Description", application_id: 1003 },
  ]);
});

afterAll(async () => {
  await knex("event").where({ name: "event" }).del();
  await knex("event").where({ name: "New event" }).del();
  await knex("event").where({ name: "Test Event" }).del();
  await knex("event").where({ name: "Existing event" }).del();
  server.close();
});

describe("GET /api/events", () => {
  it("should return a list of events with pagination", async () => {
    const response = await request(server)
      .get("/api/events")
      .set("x-auth-token", token)
      .query({ page: 1, limit: 2 });
    expect(response.status).toBe(StatusCodes.OK);
  });
});

describe("GET /api/events/:id", () => {
  it("should return the event with the given ID", async () => {
    const response = await request(server)
      .get("/api/events/362")
      .set("x-auth-token", token);

    expect(response.status).toBe(200);
    expect(response.body.id).toBeDefined();
  });

  it("should return 404 Not Found if the event with the given ID is not found", async () => {
    const nonExistentEventId = 999999;

    const response = await request(server)
      .get(`/api/events/${nonExistentEventId}`)
      .set("x-auth-token", token);

    expect(response.status).toBe(404);
    expect(response.text).toBe("The event with the given ID is not found");
  });
});

describe("POST /api/events", () => {
  it("should create a new event", async () => {
    // Create a new event with the extracted application ID
    const newEvent = {
      name: "New event",
      description: "New event Description",
      application_id: 1003,
    };

    const response = await request(server)
      .post("/api/events")
      .set("x-auth-token", token)
      .send(newEvent)
      .expect(StatusCodes.OK);

    // Verify that the response matches the provided data
    expect(response.body).toMatchObject(newEvent);
    expect(response.body.id).toBeDefined();
  });

  it("should return 409 Conflict if an event with the same name exists for the application", async () => {
    // Insert a conflicting event into the database
    await knex("event").insert({
      name: "Test Event",
      description: "Conflict Description",
      application_id: 1003,
    });

    const response = await request(server)
      .post("/api/events")
      .set("x-auth-token", token)
      .send({
        name: "Test Event",
        description: "Conflict Description",
        application_id: 1003,
      });

    expect(response.status).toBe(409);
    expect(response.text).toBe(
      "An event with the same name already exists for the application"
    );
  });

  it("should return 404 Not Found if the specified application does not exist", async () => {
    const response = await request(server)
      .post("/api/events")
      .set("x-auth-token", token)
      .send({
        name: "Test Event",
        description: "Test Description",
        application_id: 2,
      });

    expect(response.status).toBe(404);
    expect(response.text).toBe("Application not found");
  });
});

describe("PUT /api/events", () => {
  it("should return 409 Conflict if an event with the same name exists for the application", async () => {
    // Insert a conflicting event into the database
    await knex("event").insert({
      name: "Test Event",
      description: "Conflict Description",
      application_id: 1003,
    });

    const response = await request(server)
      .put("/api/events/362")
      .set("x-auth-token", token)
      .send({
        name: "Test Event",
        description: "Conflict Description",
        application_id: 1003,
      });

    expect(response.status).toBe(409);
    expect(response.text).toBe(
      "An event with the same name already exists for the application"
    );
  });

  it("should return 404 Not Found if the specified event does not exist", async () => {
    const response = await request(server)
      .post("/api/events")
      .set("x-auth-token", token)
      .send({
        name: "Test Event",
        description: "Test Description",
        application_id: 2,
      });

    expect(response.status).toBe(404);
    expect(response.text).toBe("Application not found");
  });

  it("should update existing event", async () => {
    const newEvent = {
      name: "Updated",
      description: "New event Description",
      application_id: 1003,
    };

    const response = await request(server)
      .put("/api/events/362")
      .set("x-auth-token", token)
      .send(newEvent)
      .expect(StatusCodes.OK);

    // Verify that the response matches the provided data
    expect(response.body).toMatchObject(newEvent);
    expect(response.body.id).toBeDefined();
  });

  it("should return 404 Not Found if the event with the given ID does not exist", async () => {
    const nonExistingEventID = 999;
    const eventData = {
      name: "New Event Name",
      description: "New event description",
      application_id: 1003,
    };

    const response = await request(server)
      .put(`/api/events/${nonExistingEventID}`)
      .set("x-auth-token", token)
      .send(eventData)
      .expect(404);

    expect(response.text).toBe("The event with the given ID is not found");
  });
});

describe("DELETE /api/events", () => {
  it("should delete an existing event", async () => {
    // Insert a test application into the database
    const existingEvent = {
      name: "Existing event",
      description: "Existing event Description",
      application_id: 1003,
    };
    const insertedEvent = await knex("event")
      .insert(existingEvent)
      .returning("*");

    const response = await request(server)
      .delete(`/api/events/${insertedEvent[0].id}`)
      .set("x-auth-token", token)
      .expect(StatusCodes.OK);

    expect(response.body).toMatchObject(existingEvent);
  });

  it("should return 404 not found if the event with the given ID does not exist", async () => {
    const nonExistingEventID = 999;

    const response = await request(server)
      .delete(`/api/events/${nonExistingEventID}`)
      .set("x-auth-token", token)
      .expect(404);

    expect(response.text).toBe("The event with the given ID is not found");
  });
});
