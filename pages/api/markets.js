import { checkAuthAndRequest } from "lib/checkAuthAndRequest";
import { requestBuilder } from "lib/requestBuilder.js";
import listOfRarepepe from "lib/listOfRarepepe.js";
import listOfFakerare from "lib/listOfFakerare.js";
import {
	filterResponseMarkets,
	getResponseParsedForRarepepe,
	getResponseParsedForFakerare,
} from "lib/formatData.js";
import { getBulkOfUpdate } from "lib/getBulkOfUpdate.js";
import { getBTCBlockchainData, fetchCounterparty } from "lib/fetcher.js";
import { updateBulkInDB } from "lib/handleDB.js";
import { nowInTimestamp } from "lib/time.js";

const handlerMarkets = async (req, res) => {
	try {
		checkAuthAndRequest(req);
		const collection = req.query.collection;
		if (!collection) throw "please provide a collection name";
		const BTCData = await getBTCBlockchainData();
		const BTCActualBlock = BTCData.data.height;
		const requestMarketsOrders = requestBuilder("get_orders", {
			filters: [
				{ field: "block_index", op: ">=", value: BTCActualBlock - 30 },
				{ field: "status", op: "==", value: "filled" },
			],
			filterop: "AND",
		});
		const marketOrdersFromAPI = await fetchCounterparty(requestMarketsOrders, "get_orders");
		const marketsOrdersOfCollection = filterResponseMarkets(
			marketOrdersFromAPI,
			collection === "rarepepe" ? listOfRarepepe : listOfFakerare
		);
		const responseParsedByNameAndAsset =
			collection === "rarepepe"
				? getResponseParsedForRarepepe(marketsOrdersOfCollection)
				: getResponseParsedForFakerare(marketsOrdersOfCollection);

		if (responseParsedByNameAndAsset.length > 0) {
			const now = nowInTimestamp();
			const bulkOfUpdateMarkets = getBulkOfUpdate(responseParsedByNameAndAsset, "markets", now);
			await updateBulkInDB(collection, bulkOfUpdateMarkets);
			return res.status(200).json({
				action: "update Markets - Updated",
				BTCActualBlock,
				fromBlock: BTCActualBlock - 30,
				succes: true,
				Collection: collection,
				MarketsOrdersFound: marketOrdersFromAPI.length,
				marketsOrdersOfCollection: marketsOrdersOfCollection.length,
				CardsUpdated: responseParsedByNameAndAsset.filter((card) => card !== false).length,
				ListOfCards: responseParsedByNameAndAsset.map(
					(card) => card && card !== false && card.name
				),
			});
		}
		return res.status(200).json({
			action: "update Markets - No Update !",
			BTCActualBlock,
			fromBlock: BTCActualBlock - 30,
			succes: true,
			Collection: collection,
			MarketsOrdersFound: marketOrdersFromAPI.length,
			NumberOfDispensesCollectionFound: marketsOrdersOfCollection.length,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).send({
			error,
		});
	}
};

export default handlerMarkets;
