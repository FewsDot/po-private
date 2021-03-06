import Twitter from "twitter";

const client = new Twitter({
	consumer_key: process.env.TWITTER_API_ACCESS,
	consumer_secret: process.env.TWITTER_API_SECRET,
	access_token_key: process.env.TWITTER_ACCESS_TOKEN,
	access_token_secret: process.env.TWITTER_ACCES_TOKEN_SECRET,
});

const postTweet = async (tweet) => {
	try {
		return client.post("statuses/update", {
			status: tweet,
		});
	} catch (error) {
		console.log(error);
		return error;
	}
};

const postTweetWithImg = async (imageToBase64, text) => {
	try {
		return client.post(
			"media/upload",
			{ media_data: imageToBase64 },
			function (error, media, response) {
				if (!error) {
					var status = {
						status: text,
						media_ids: media.media_id_string,
					};
					client.post("statuses/update", status);
				} else {
					console.log(error);
				}
			}
		);
	} catch (error) {
		console.log(error);
		return error;
	}
};

const getDataMarketTweet = (arrayOfMarketData, collectionName) => {
	if (arrayOfMarketData.length > 0) {
		const {
			cardsWithMarket,
			cardsWithoutMarket,
			globalMarketCap,
			middleMarketCap,
			middlePricePerCard,
			supplyData,
		} = arrayOfMarketData[0];
		const dollarUSLocale = Intl.NumberFormat("en-US");
		const globalMcap = dollarUSLocale.format(Math.round(globalMarketCap));
		const averageMcap = dollarUSLocale.format(Math.round(middleMarketCap));
		const averagePricePerCard = dollarUSLocale.format(middlePricePerCard.toFixed(2));
		const percentDestructedOrBurned = (100 - supplyData.percentOfRealSupply).toFixed(2);

		return `#${arrayOfMarketData[0].collection === "rarepepe" ? "RarePepe" : "FakeRare"} Market Data
		${cardsWithMarket} Cards with market
		${cardsWithoutMarket} Cards without market
		Global M.Cap: ${globalMcap}$ 
		Average M.Cap: ${averageMcap}$
		Average price per card : ${averagePricePerCard}$
		% of Supply Burned or Destructed : ${percentDestructedOrBurned}%
		
		Feels Good Man ! 🐸`;
	}
	return `No Update For ${collectionName}`;
};

const getArbitrageTweet = (arbitrage) => {
	const {
		btcPrice,
		pepecashPrice,
		xcpPrice,
		collection,
		name,
		spread,
		hoursSinceLastTx,
		quantity,
		burned,
		img_url,
		destructed,
	} = arbitrage;
	const collectionFormatted = collection === "rarepepe" ? "Rarepepe" : "Fakerare";
	return btcPrice && pepecashPrice && xcpPrice
		? {
				text: `Arbitrages done in the last 6 hours
		Collection: ${collectionFormatted}
		Name: ${name}
		BTC Value: ${btcPrice.toFixed(2)}$
		PEPECASH Value: ${pepecashPrice}$
		XCP Value: ${xcpPrice.toFixed(2)}$
		Spread: ${Math.abs(spread.toFixed(2))}%
		${hoursSinceLastTx}H ago
		Total Supply: ${quantity + burned + destructed}
		Burned: ${burned}
		Destroyed: ${destructed}`,
				img_url: img_url,
		  }
		: btcPrice && pepecashPrice
		? {
				text: `Arbitrages done in the last 6 hours
		Collection: ${collectionFormatted}
		Name: ${name}
		BTC Value: ${btcPrice.toFixed(2)}$
		PEPECASH Value: ${pepecashPrice}$
		Spread: ${Math.abs(spread.toFixed(2))}%
		${hoursSinceLastTx}H ago
		Total Supply: ${quantity + burned + destructed}
		Burned: ${burned}
		Destroyed: ${destructed}`,
				img_url: img_url,
		  }
		: btcPrice && xcpPrice
		? {
				text: `Arbitrages done in the last 6 hours
		Collection: ${collectionFormatted}
		Name: ${name}
		BTC Value: ${btcPrice.toFixed(2)}$
		XCP Value: ${xcpPrice.toFixed(2)}$
		Spread: ${Math.abs(spread.toFixed(2))}%
		${hoursSinceLastTx}H ago
		Total Supply: ${quantity + burned + destructed}
		Burned: ${burned}
		Destroyed: ${destructed}`,
				img_url: img_url,
		  }
		: {
				text: `Arbitrages done in the last 6 hours
		Collection: ${collectionFormatted}
		Name: ${name}
		PEPECASH Value: ${pepecashPrice}$
		XCP Value: ${xcpPrice.toFixed(2)}$
		Spread: ${Math.abs(spread.toFixed(2))}%
		${hoursSinceLastTx}H ago
		Total Supply: ${quantity + burned + destructed}
		Burned: ${burned}
		Destroyed: ${destructed}`,
				img_url: img_url,
		  };
};

export { postTweet, postTweetWithImg, getDataMarketTweet, getArbitrageTweet };
