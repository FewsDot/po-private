import { checkAuthAndRequest } from "lib/checkAuthAndRequest";
import { requestBuilder } from "lib/requestBuilder.js";
import listOfRarepepe from "lib/listOfRarepepe.js";
import listOfFakerare from "lib/listOfFakerare.js";
import {
	filterResponseByTypeOfCards,
	buildMultiFiltersRequest,
	formatDispenserLastSales,
} from "lib/formatData.js";
import { getBulkOfUpdate } from "lib/handleMongoRequest";
import { getBTCBlockchainData, fetchCounterparty } from "lib/fetcher.js";
import { updateBulkInDB } from "lib/handleDB.js";
import { nowInTimestamp } from "lib/time.js";

const handlerDispenses = async (req, res) => {
	try {
		checkAuthAndRequest(req);
		const collection = req.query.collection;
		if (!collection) throw "please provide a collection name";
		const BTCData = await getBTCBlockchainData();
		const BTCActualBlock = BTCData.data.height;
		const requestDispenses = requestBuilder("get_dispenses", {
			filters: { field: "block_index", op: ">=", value: BTCActualBlock - 50 },
		});
		const dispensesFromAPI = await fetchCounterparty(requestDispenses, "get_dispenses");
		const dispensesOfCollection = filterResponseByTypeOfCards(
			dispensesFromAPI,
			collection == "rarepepe" ? listOfRarepepe : listOfFakerare
		);
		const filtersOfCollection = buildMultiFiltersRequest(
			dispensesOfCollection,
			"tx_hash",
			"dispensers"
		);
		const arrayOfDispensesWithBlockIndex = dispensesOfCollection.map((item) => ({
			asset: item.asset,
			block_index: item.block_index,
		}));

		if (filtersOfCollection.length > 0) {
			const requestDispensers = requestBuilder("get_dispensers", {
				filters: filtersOfCollection,
				filterop: "OR",
			});
			const dispensersDataFromAPI = await fetchCounterparty(requestDispensers, "get_dispensers");
			const dispensesToSaveInDB = formatDispenserLastSales(
				dispensersDataFromAPI,
				arrayOfDispensesWithBlockIndex
			);
			const now = nowInTimestamp();
			const bulkOfUpdateDispenses = getBulkOfUpdate(dispensesToSaveInDB, "dispenses", now);
			await updateBulkInDB(collection, bulkOfUpdateDispenses);

			return res.status(200).json({
				action: "update Dispenses",
				BTCActualBlock,
				fromBlock: BTCActualBlock - 50,
				succes: true,
				DispensesFind: dispensesFromAPI.length,
				Collection: collection,
				CollectionOfDispensesFind: dispensesOfCollection.length,
				dispensesToSaveInDB: dispensesToSaveInDB.length,
				ListOfCardsUpdated: dispensesToSaveInDB.map((item) => item.name),
			});
		}

		return res.status(200).json({
			action: "update Dispenses",
			BTCActualBlock,
			fromBlock: BTCActualBlock - 50,
			succes: true,
			DispensesFound: dispensesFromAPI.length,
			Collection: collection,
			NumberOfDispensesCollectionFound: 0,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).send({
			error,
		});
	}
};

export default handlerDispenses;
