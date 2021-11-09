import Twitter from "twitter";

const client = new Twitter({
	consumer_key: process.env.TWITTER_API_ACCESS,
	consumer_secret: process.env.TWITTER_API_SECRET,
	access_token_key: process.env.TWITTER_ACCESS_TOKEN,
	access_token_secret: process.env.TWITTER_ACCES_TOKEN_SECRET,
});

const postTweet = async (tweet) => {
	try {
		return client.post("statuses/update", { status: tweet });
	} catch (error) {
		return error;
	}
};

const getDataTweet = (arrayOfMarketData, collectionName) => {
	return arrayOfMarketData.length > 0
		? `#${arrayOfMarketData[0].collection === "rarepepe" ? "RarePepe" : "FakeRare"} Update Market
    - MarketCap Global : ${arrayOfMarketData[0].globalMarketCap}$
    - MarketCap Middle : ${arrayOfMarketData[0].middleMarketCap}$
    - Middle price per Card : ${arrayOfMarketData[0].middlePricePerCard}$`
		: `No Update For ${collectionName}`;
};

export { postTweet, getDataTweet };
