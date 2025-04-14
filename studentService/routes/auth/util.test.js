// const { verifyRole, verifyJWTWithJWKS } = require("./util"); // Import your function

// jest.mock("../authUtils", () => ({
//   verifyJWTWithJWKS: jest.fn(),
// }));

// describe("verifyRole Middleware", () => {
//   let mockReq, mockRes, mockNext;

//   beforeEach(() => {
//     mockReq = {
//       headers: {},
//     };
//     mockRes = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//     };
//     mockNext = jest.fn();
//   });

//   test("should return 401 if token is missing", async () => {
//     const middleware = verifyRole(["ADMIN"]); // Requires 'ADMIN' role
//     await middleware(mockReq, mockRes, mockNext);

//     expect(mockRes.status).toHaveBeenCalledWith(401);
//     expect(mockRes.json).toHaveBeenCalledWith({
//       message: "Authorization token is missing",
//     });
//   });

//   test("should return 403 if token is invalid", async () => {
//     mockReq.headers.authorization = "Bearer invalid_token";
//     verifyJWTWithJWKS.mockRejectedValue(new Error("Invalid Token"));

//     const middleware = verifyRole(["ADMIN"]);
//     await middleware(mockReq, mockRes, mockNext);

//     expect(mockRes.status).toHaveBeenCalledWith(403);
//     expect(mockRes.json).toHaveBeenCalledWith({
//       message: "Invalid or expired token",
//       error: "Invalid Token",
//     });
//   });

//   test("should return 403 if user does not have required role", async () => {
//     mockReq.headers.authorization = "Bearer valid_token";
//     verifyJWTWithJWKS.mockResolvedValue({ roles: ["USER"] }); // No 'ADMIN' role

//     const middleware = verifyRole(["ADMIN"]);
//     await middleware(mockReq, mockRes, mockNext);

//     expect(mockRes.status).toHaveBeenCalledWith(403);
//     expect(mockRes.json).toHaveBeenCalledWith({
//       message: "Access forbidden: Insufficient role",
//     });
//   });

//   test("should call next() if user has required role", async () => {
//     mockReq.headers.authorization = "Bearer valid_token";
//     verifyJWTWithJWKS.mockResolvedValue({ roles: ["ADMIN"] }); // User has 'ADMIN' role

//     const middleware = verifyRole(["ADMIN"]);
//     await middleware(mockReq, mockRes, mockNext);

//     expect(mockNext).toHaveBeenCalled();
//     expect(mockRes.status).not.toHaveBeenCalled(); // Ensure no error response is sent
//   });
// });
