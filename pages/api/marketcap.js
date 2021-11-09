import { checkAuthAndRequest } from "lib/checkAuthAndRequest";
import { getManyInDB, createInDB } from "lib/handleDB.js";
import listOfFakerare from "lib/listOfFakerare.js";
import listOfRarepepe from "lib/listOfRarepepe.js";
import { getGlobalMarketCap, getSupplyData } from "lib/globalMarketData.js";
import { nowInTimestamp } from "lib/time.js";

const handlerMarketCap = async (req, res) => {
	try {
		checkAuthAndRequest(req);
		const collection = req.query.collection;
		if (!collection) throw "please provide a collection name";
		const now = nowInTimestamp();
		const listOfCollection = collection === "rarepepe" ? listOfRarepepe : listOfFakerare;
		const cardsWithMarketValues = await getManyInDB(
			collection,
			{ "market.lastValueInUSD": { $gt: 0 } },
			{ projection: { name: 1, market: 1, quantity: 1, burned: 1, destructed: 1, _id: 0 } }
		);
		const globalMarketCap = getGlobalMarketCap(cardsWithMarketValues);
		const supplyData = getSupplyData(cardsWithMarketValues);
		const middlePricePerCard = globalMarketCap / supplyData.realSupply;
		const cardsWithMarket = cardsWithMarketValues.length;
		const cardsWithoutMarket = listOfCollection.length - cardsWithMarket;
		const middleMarketCap = globalMarketCap / cardsWithMarket;

		const globalMarketData = {
			action: "Save Markets Data",
			timestamp: now,
			collection,
			cardsWithMarket,
			cardsWithoutMarket,
			globalMarketCap,
			middleMarketCap,
			supplyData,
			middlePricePerCard,
			succes: true,
		};
		await createInDB("globalMarketsData", globalMarketData);
		return res.status(200).json(globalMarketData);
	} catch (error) {
		console.log(error);
		return res.status(500).send({
			error,
		});
	}
};

export default handlerMarketCap;
