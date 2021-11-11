import { checkAuthAndRequest } from "lib/checkAuthAndRequest";
import { getManyInDB } from "lib/handleDB";
import { nowInTimestamp } from "lib/time";
import { postTweet, getDataMarketTweet } from "lib/tweet";

const handlerTweetMcap = async (req, res) => {
	try {
		checkAuthAndRequest(req);
		const now = nowInTimestamp();
		const tenMinutes = 600;
		const mostRecentRarepepeData = await getManyInDB(
			"globalMarketsData",
			{ collection: "rarepepe", timestamp: { $gt: now - tenMinutes } },
			{}
		);
		const mostRecentFakerareData = await getManyInDB(
			"globalMarketsData",
			{ collection: "fakerare", timestamp: { $gt: now - tenMinutes } },
			{}
		);
		const rarepepeDatasTweet = getDataMarketTweet(mostRecentRarepepeData, "rarepepe");
		const fakerareDatasTweet = getDataMarketTweet(mostRecentFakerareData, "fakerare");
		const rarepepePost = await postTweet(rarepepeDatasTweet);
		const fakerarePost = await postTweet(fakerareDatasTweet);

		return res.status(200).json({
			action: "Tweet  MarketCap !",
			rarepepePost,
			fakerarePost,
			succes: true,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).send({
			error,
		});
	}
};

export default handlerTweetMcap;
