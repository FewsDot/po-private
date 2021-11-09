import { checkAuthAndRequest } from "lib/checkAuthAndRequest";

const handler = async (req, res) => {
	try {
		checkAuthAndRequest(req);
	} catch (error) {}
};

export default handler;
