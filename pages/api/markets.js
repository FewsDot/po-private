import { checkAuthAndRequest } from "lib/checkAuthAndRequest";
import { requestBuilder } from "lib/requestBuilder.js";
import listOfRarepepe from "lib/listOfRarepepe.js";
import listOfFakerare from "lib/listOfFakerare.js";
import {
	filterResponseMarkets,
	getOrderFormattedByType,
	formatAndSortAllArrayOfOrders,
} from "lib/formatData.js";
import { getBulkOfUpdate } from "lib/handleMongoRequest";
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
				{ field: "block_index", op: ">=", value: BTCActualBlock - 50 },
				{ field: "status", op: "==", value: "filled" },
			],
			filterop: "AND",
		});
		const marketOrdersFromAPI = await fetchCounterparty(requestMarketsOrders, "get_orders");
		const marketsOrdersOfCollection = filterResponseMarkets(
			marketOrdersFromAPI,
			collection === "rarepepe" ? listOfRarepepe : listOfFakerare
		);
		const orderPPCtoXCP = marketsOrdersOfCollection
			.filter((item) => item.give_asset === "PEPECASH")
			.filter((item) => item.get_asset === "XCP")
			.map((item) => getOrderFormattedByType(item, "PPCXCP"))
			.sort((a, b) => (a.block > b.block ? -1 : b.block > a.block ? 1 : 0));
		const orderXCPtoPPC = marketsOrdersOfCollection
			.filter((item) => item.give_asset === "XCP")
			.filter((item) => item.get_asset === "PEPECASH")
			.map((item) => getOrderFormattedByType(item, "XCPPPC"))
			.sort((a, b) => (a.block > b.block ? -1 : b.block > a.block ? 1 : 0));
		const orderRarepepetoPPC = marketsOrdersOfCollection
			.filter((item) => item.give_asset !== "PEPECASH" && item.give_asset !== "XCP")
			.filter((item) => item.get_asset === "PEPECASH")
			.map((item) => getOrderFormattedByType(item, "RPPPPC"));
		const orderRarepepetoXCP = marketsOrdersOfCollection
			.filter((item) => item.give_asset !== "PEPECASH" && item.give_asset !== "XCP")
			.filter((item) => item.get_asset === "XCP")
			.map((item) => getOrderFormattedByType(item, "RPPXCP"));
		const orderPPCtoRarepepe = marketsOrdersOfCollection
			.filter((item) => item.give_asset === "PEPECASH")
			.filter((item) => item.get_asset !== "PEPECASH" && item.get_asset !== "XCP")
			.map((item) => getOrderFormattedByType(item, "PPCRPP"));
		const orderXCPtoRarepepe = marketsOrdersOfCollection
			.filter((item) => item.give_asset === "XCP")
			.filter((item) => item.get_asset !== "XCP" && item.get_asset !== "PEPECASH")
			.map((item) => getOrderFormattedByType(item, "XCPRPP"));

		const getArrayOfResultToUpload = formatAndSortAllArrayOfOrders([
			orderPPCtoXCP.length > 0 ? orderPPCtoXCP.find((element) => element) : [],
			orderXCPtoPPC.length > 0 ? orderXCPtoPPC.find((element) => element) : [],
			orderRarepepetoPPC,
			orderRarepepetoXCP,
			orderPPCtoRarepepe,
			orderXCPtoRarepepe,
		]);

		if (getArrayOfResultToUpload.length > 0) {
			const now = nowInTimestamp();
			const bulkOfUpdateMarkets = getBulkOfUpdate(getArrayOfResultToUpload, "markets", now);
			await updateBulkInDB(collection, bulkOfUpdateMarkets);
			return res.status(200).json({
				action: "update Markets - Updated",
				BTCActualBlock,
				fromBlock: BTCActualBlock - 50,
				succes: true,
				Collection: collection,
				bulkOfUpdateMarketsLength: bulkOfUpdateMarkets.length,
				MarketsOrdersFound: marketOrdersFromAPI.length,
				marketsOrdersOfCollection: marketsOrdersOfCollection.length,
				CardsUpdated: getArrayOfResultToUpload.filter((card) => card !== false).length,
				ListOfCards: getArrayOfResultToUpload.map((card) => card && card !== false && card.name),
			});
		}
		return res.status(200).json({
			action: "update Markets - No Update !",
			BTCActualBlock,
			fromBlock: BTCActualBlock - 50,
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
