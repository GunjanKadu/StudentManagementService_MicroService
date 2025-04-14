const request = require("supertest");
const express = require("express");
const loginRouter = require("../routes/auth/loginRoute");

jest.mock("../routes/auth/util", () => ({
  fetchStudents: jest.fn(),
  fetchProfessors: jest.fn(),
  generateJWTWithPrivateKey: jest.fn(() => "mocked-token"),
}));

const bcrypt = require("bcryptjs");
const { fetchStudents, fetchProfessors } = require("../routes/auth/util");

const app = express();
app.use(express.json());
app.use("/login", loginRouter);

describe("Login API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("POST /login/student", () => {
    it("should return 400 if email or password is missing", async () => {
      const res = await request(app).post("/login/student").send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Email and password are required");
    });

    it("should return 404 if student not found", async () => {
      fetchStudents.mockResolvedValue([]);
      const res = await request(app).post("/login/student").send({
        email: "notfound@example.com",
        password: "password123",
      });
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Student not found");
    });

    it("should return 401 if password is incorrect", async () => {
      fetchStudents.mockResolvedValue([
        { email: "test@example.com", password: "hashed" },
      ]);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(false);

      const res = await request(app).post("/login/student").send({
        email: "test@example.com",
        password: "wrongpassword",
      });
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe("Invalid credentials");
    });

    it("should return 200 and token if login is successful", async () => {
      fetchStudents.mockResolvedValue([
        { _id: "123", email: "test@example.com", password: "hashed" },
      ]);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

      const res = await request(app).post("/login/student").send({
        email: "test@example.com",
        password: "correctpassword",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.access_token).toBe("mocked-token");
    });
  });
});
