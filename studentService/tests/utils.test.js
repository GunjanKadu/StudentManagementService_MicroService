const express = require("express");
const request = require("supertest");
const { verifyRole, restrictStudentToOwnData } = require("../routes/auth/util");

// Mock token verification to bypass real JWT + JWKS
jest.mock("../routes/auth/util", () => {
  const original = jest.requireActual("../routes/auth/util");
  return {
    ...original,
    verifyJWTWithJWKS: jest.fn(() =>
      Promise.resolve({ id: "123", roles: ["STUDENT"] })
    ),
  };
});

describe("Middleware Tests", () => {
  let app;

  beforeEach(() => {
    //test
    app = express();
    app.use(express.json());
  });

  describe("verifyRole middleware", () => {
    it("should return 401 if token is missing", async () => {
      app.get("/test", verifyRole(["STUDENT"]), (req, res) => {
        res.status(200).json({ message: "Access granted" });
      });

      const res = await request(app).get("/test");
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Authorization token is missing");
    });
  });

  describe("restrictStudentToOwnData middleware", () => {
    it("should allow student accessing their own data", async () => {
      app.get(
        "/student/:id",
        (req, res, next) => {
          req.user = { id: "123", roles: ["STUDENT"] };
          next();
        },
        restrictStudentToOwnData,
        (req, res) => {
          res.status(200).json({ message: "Access granted" });
        }
      );

      const res = await request(app).get("/student/123");
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Access granted");
    });

    it("should allow non-students", async () => {
      app.get(
        "/student/:id",
        (req, res, next) => {
          req.user = { id: "789", roles: ["ADMIN"] };
          next();
        },
        restrictStudentToOwnData,
        (req, res) => {
          res.status(200).json({ message: "Access granted" });
        }
      );

      const res = await request(app).get("/student/456");
      expect(res.status).toBe(200);
    });
  });
});
