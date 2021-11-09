import { checkAuthAndRequest } from "lib/checkAuthAndRequest";
import { getCryptosPrices } from "lib/fetcher.js";
import { nowInTimestamp } from "lib/time.js";
import { getManyInDB, updateBulkInDB } from "lib/handleDB.js";
import { getMostRecentTxAndPrice } from "lib/formatData.js";
import { getBulkOfUpdate } from "lib/getBulkOfUpdate.js";

const handlerHighestValue = async (req, res) => {
	try {
		checkAuthAndRequest(req);
		const collection = req.query.collection;
		if (!collection) throw "please provide a collection name";
		const cryptoPrices = await getCryptosPrices();
		const now = nowInTimestamp();
		const twelveHoursInMs = 43200;
		const cardsToUpdate = await getManyInDB(
			collection,
			{
				$or: [
					{ "market.dispenser.lastUpdate": { $gt: now - twelveHoursInMs } },
					{ "market.dex.lastUpdate": { $gt: now - twelveHoursInMs } },
				],
			},
			{ projection: { name: 1, market: 1, _id: 0 } }
		);

		if (cardsToUpdate.length > 0) {
			const mostRecentsTx = getMostRecentTxAndPrice(cardsToUpdate, cryptoPrices.data);
			const bulkOfUpdate = getBulkOfUpdate(mostRecentsTx, "highestValue");
			await updateBulkInDB(collection, bulkOfUpdate);

			return res.status(200).json({
				action: "update Last Highest Value",
				succes: true,
				Collection: collection,
				ListOfUpdatedCards: mostRecentsTx.map((cardTxData) => cardTxData.name),
			});
		} else {
			return res.status(200).json({
				action: "update Last Highest Value - No Update",
				succes: true,
				Collection: collection,
			});
		}
	} catch (error) {
		console.log(error);
		return res.status(500).send({
			error,
		});
	}
};

export default handlerHighestValue;
