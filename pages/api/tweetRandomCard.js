import { checkAuthAndRequest } from "lib/checkAuthAndRequest";
import { getManyInDB } from "lib/handleDB";
import { nowInTimestamp } from "lib/time";
import { postTweet, getDataTweet } from "lib/tweet";

const handlerTweetRandomCard = async (req, res) => {
	try {
		checkAuthAndRequest(req);
		const collection = req.query.collection;
		if (!collection) throw "please provide a collection name";

		const randomCardWithMarketsData = await getManyInDB(
			collection,
			{ timestamp: { $gt: now - tenMinutes } },
			{}
		);

		return res.status(200).json({
			action: "Tweet  Random Card !",
			succes: true,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).send({
			error,
		});
	}
};

export default handlerTweetRandomCard;
