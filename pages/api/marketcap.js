import { checkAuthAndRequest } from "lib/backend/checkAuthAndRequest";

const handler = async (req, res) => {
	try {
		checkAuthAndRequest(req);
	} catch (error) {}
};

export default handler;
