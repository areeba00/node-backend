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
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOjEwLCJpYXQiOjE2OTAxODY0NDV9.kIUB3lY968SFwQfthvjlg_eGrIsyLxDeqz16B83YyvM";
  await knex("application").insert([
    { name: "Application 2", description: "Description 2" },
  ]);
});

afterAll(async () => {
  // Delete the inserted record from the database by checking its name
  await knex("application").where({ name: "Application 2" }).del();
  await knex("application").where({ name: "New Application" }).del();
  await knex("application").where({ name: "Existing Application" }).del();
  await knex("application").where({ name: "Updated Application" }).del();
  await knex("application").where({ name: "Conflict Application" }).del();
  server.close();
});

// Integration test for getApplication
describe("GET /applications", () => {
  it("should return a list of applications", async () => {
    const response = await request(server)
      .get("/api/applications")
      .set("x-auth-token", token);

    expect(response.status).toBe(StatusCodes.OK);
  });
});

describe("GET /api/applications/:id", () => {
  it("should return the application with the given ID", async () => {
    const response = await request(server)
      .get("/api/applications/1003")
      .set("x-auth-token", token)
      .expect(StatusCodes.OK);
    expect(response.body.id).toBeDefined();
  });

  it("should return 404 Not Found if the application with the given ID does not exist", async () => {
    const nonExistentId = 999; // Assume this ID does not exist in the database

    const response = await request(server)
      .get(`/api/applications/${nonExistentId}`)
      .set("x-auth-token", token)
      .expect(StatusCodes.NOT_FOUND);

    expect(response.text).toBe("The app with the given ID is not found");
  });
});

describe("POST /api/applications", () => {
  it("should create a new application", async () => {
    const newApplication = {
      name: "New Application",
      description: "New Application Description",
    };

    const response = await request(server)
      .post("/api/applications")
      .set("x-auth-token", token)
      .send(newApplication)
      .expect(StatusCodes.OK);

    expect(response.body).toMatchObject(newApplication);
    expect(response.body.id).toBeDefined();
  });

  it("should return 409 Conflict if an application with the same name already exists", async () => {
    // Insert a test application with the same name into the database
    const existingApplication = {
      name: "Existing Application",
      description: "Existing Application Description",
    };
    await knex("application").insert(existingApplication);

    const newApplication = {
      name: "Existing Application",
      description: "New Application Description",
    };

    const response = await request(server)
      .post("/api/applications")
      .set("x-auth-token", token)
      .send(newApplication)
      .expect(StatusCodes.CONFLICT);

    expect(response.text).toBe(
      "An application with the same name already exists"
    );
  });
});

describe("PUT /api/applications/:id", () => {
  it("should update an existing application", async () => {
    // Insert a test application into the database
    const existingApplication = {
      name: "Existing Application",
      description: "Existing Application Description",
    };
    const insertedApplication = await knex("application")
      .insert(existingApplication)
      .returning("*");

    const updatedApplication = {
      name: "Updated Application",
      description: "Updated Application Description",
    };

    const response = await request(server)
      .put(`/api/applications/${insertedApplication[0].id}`)
      .set("x-auth-token", token)
      .send(updatedApplication)
      .expect(StatusCodes.OK);

    expect(response.body).toMatchObject(updatedApplication);
    expect(response.body.id).toBeDefined();
  });

  it("should return 404 Not Found if the application with the given ID does not exist", async () => {
    const updatedApplication = {
      name: "Error Application",
      description: "Updated Application Description",
    };

    const response = await request(server)
      .put("/api/applications/999")
      .set("x-auth-token", token)
      .send(updatedApplication)
      .expect(StatusCodes.NOT_FOUND);

    expect(response.text).toBe("The app with the given ID is not found");
  });

  it("should return 409 Conflict if an application with the same name already exists", async () => {
    // Insert a test application with the same name into the database
    const existingApplication = {
      name: "Conflict Application",
      description: "Existing Application Description",
    };
    await knex("application").insert(existingApplication);

    const response = await request(server)
      .put("/api/applications/1003")
      .set("x-auth-token", token)
      .send(existingApplication)
      .expect(StatusCodes.CONFLICT);

    expect(response.text).toBe(
      "An application with the same name already exists"
    );
  });
});

describe("DELETE /api/applications/:id", () => {
  it("should delete an existing application", async () => {
    // Insert a test application into the database
    const existingApplication = {
      name: "Existing Application",
      description: "Existing Application Description",
    };
    const insertedApplication = await knex("application")
      .insert(existingApplication)
      .returning("*");

    const response = await request(server)
      .delete(`/api/applications/${insertedApplication[0].id}`)
      .set("x-auth-token", token)
      .expect(StatusCodes.OK);

    expect(response.body).toMatchObject(existingApplication);
  });

  it("should return 404 Not Found if the application with the given ID does not exist", async () => {
    const response = await request(server)
      .delete("/api/applications/999")
      .set("x-auth-token", token)
      .expect(StatusCodes.NOT_FOUND);

    expect(response.text).toBe("The app with the given ID is not found");
  });
});
