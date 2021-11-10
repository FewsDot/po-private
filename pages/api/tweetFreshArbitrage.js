import { checkAuthAndRequest } from "lib/checkAuthAndRequest";
import { getManyInDB } from "lib/handleDB";
import { formatArbitragesData } from "lib/formatData";
import { getLastArbitrages } from "lib/handleMongoRequest";
import { getBTCBlockchainData, getCryptosPrices } from "lib/fetcher";
import { postTweet, getDataTweet } from "lib/tweet";

const handlerTweetRandomCard = async (req, res) => {
	try {
		checkAuthAndRequest(req);
		const BTCData = await getBTCBlockchainData();
		const cryptoPrices = await getCryptosPrices();
		const BTCActualBlock = BTCData.data.height;
		const sixHoursInBTCBlocks = BTCActualBlock - 66;
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

		const arrayOfAllArbitrages = formattedRarepepeArbitrage.concat(formattedFakerareArbitrage);

		return res.status(200).json({
			action: "Tweet  Fresh Arbitrage !",
			NumberOfRarepepe: formattedRarepepeArbitrage.length,
			NumberOfFakerare: formattedFakerareArbitrage.length,
			arrayOfAllArbitrages,
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
