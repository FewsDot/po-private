import { checkAuthAndRequest } from "lib/checkAuthAndRequest";
import { getManyInDB } from "lib/handleDB";
import { formatArbitragesData } from "lib/formatData";
import { getLastArbitrages } from "lib/handleMongoRequest";
import { getBTCBlockchainData, getCryptosPrices } from "lib/fetcher";
import { postTweet, getArbitrageTweet } from "lib/tweet";

const handlerTweetRandomCard = async (req, res) => {
	try {
		checkAuthAndRequest(req);
		const BTCData = await getBTCBlockchainData();
		const cryptoPrices = await getCryptosPrices();
		const BTCActualBlock = BTCData.data.height;
		const sixHoursInBTCBlocks = BTCActualBlock - 244;
		const lastArbitrages = getLastArbitrages(sixHoursInBTCBlocks);
		const lastFreshArbitrageRarepepe = await getManyInDB(
			"rarepepe",
			lastArbitrages.query,
			lastArbitrages.projection
		);
		const lastFreshArbitrageFakerare = await getManyInDB(
			"fakerare",
			lastArbitrages.query,
			lastArbitrages.projection
		);
		const formattedRarepepeArbitrage = formatArbitragesData(
			lastFreshArbitrageRarepepe,
			BTCActualBlock,
			"rarepepe",
			cryptoPrices.data
		);
		const formattedFakerareArbitrage = formatArbitragesData(
			lastFreshArbitrageFakerare,
			BTCActualBlock,
			"fakerare",
			cryptoPrices.data
		);
		const arrayOfAllArbitrages = formattedRarepepeArbitrage
			.concat(formattedFakerareArbitrage)
			.filter((item) => item.name !== "PEPECASH");

		if (arrayOfAllArbitrages.length > 0) {
			arrayOfAllArbitrages.forEach(async (arbitrage) => {
				console.log(getArbitrageTweet(arbitrage));
			});

			return res.status(200).json({
				action: "Tweet  Fresh Arbitrage !",
				NumberOfRarepepe: formattedRarepepeArbitrage.length,
				NumberOfFakerare: formattedFakerareArbitrage.length,
				arrayOfAllArbitrages,
				succes: true,
			});
		} else {
			return res.status(200).json({
				action: "Tweet  Fresh Arbitrage - No Arbitrages found !",
				succes: true,
			});
		}
	} catch (error) {
		console.log(error);
		return res.status(500).send({
			error,
		});
	}
};

export default handlerTweetRandomCard;
