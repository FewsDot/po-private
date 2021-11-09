import jwt from "jsonwebtoken";
import { throwerError } from "lib/error";

const checkAuthAndRequest = (req) => {
	const method = req.method;
	const authorization = req.headers.authorization;
	method !== "GET" && throwerError("method", "Method not allowed !");
	!authorization && throwerError("auth", "Please provide JWT to Authenticate!");
	const secret = process.env.JWT_SECRET_ADMIN;
	const formattedToken = authorization.split(" ")[1];
	jwt.verify(formattedToken, secret, (err, decoded) => {
		return err ? throwerError("authFailed", err.message) : decoded;
	});
};

export { checkAuthAndRequest };
