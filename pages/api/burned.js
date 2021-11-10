import { checkAuthAndRequest } from "lib/checkAuthAndRequest";
import burnAddress from "lib/burnAddress.js";
import listOfFakerare from "lib/listOfFakerare.js";
import listOfRarepepe from "lib/listOfRarepepe.js";
import { fetchCounterparty } from "lib/fetcher.js";
import { requestBuilder } from "lib/requestBuilder.js";
import {
	filterResponseBurned,
	buildMultiFiltersRequest,
	filterResponseByTypeOfCards,
	formatDivisibleNumberFromArray,
} from "lib/formatData.js";
import { getBulkOfUpdate } from "lib/handleMongoRequest";
import { getManyInDB, updateBulkInDB } from "lib/handleDB.js";

const handlerBurned = async (req, res) => {
	try {
		checkAuthAndRequest(req);
		const filtersOfCollection = buildMultiFiltersRequest(burnAddress, "address", "burned");
		const requestBurned = requestBuilder("get_balances", {
			filters: filtersOfCollection,
			filterop: "OR",
		});
		const assetsBurnedDataFromAPI = await fetchCounterparty(requestBurned, "get_balances");
		const burnedRarepepe = filterResponseByTypeOfCards(assetsBurnedDataFromAPI, listOfRarepepe);
		const burnedFakerare = filterResponseByTypeOfCards(assetsBurnedDataFromAPI, listOfFakerare);
		const filtredRarepepe = filterResponseBurned(burnedRarepepe);
		const filtredFakerare = filterResponseBurned(burnedFakerare);

		const listOfDivisibleRarepepe = await getManyInDB(
			"rarepepe",
			{ divisible: true },
			{ projection: { _id: 0, name: 1 } }
		);
		const listOfDivisibleFakerare = await getManyInDB(
			"fakerare",
			{ divisible: true },
			{ projection: { _id: 0, name: 1 } }
		);
		const listOfDivisibleRarepepeFormatted = listOfDivisibleRarepepe.map((item) => item.name);
		const listOfDivisibleFakerareFormatted = listOfDivisibleFakerare.map((item) => item.name);
		const rarepepeBurnedAndFormatted = formatDivisibleNumberFromArray(
			filtredRarepepe,
			listOfDivisibleRarepepeFormatted
		);
		const fakerareBurnedAndFormatted = formatDivisibleNumberFromArray(
			filtredFakerare,
			listOfDivisibleFakerareFormatted
		);
		const bulkOfUpdateRarepepe = getBulkOfUpdate(rarepepeBurnedAndFormatted, "burned");
		const bulkOfUpdateFakerare = getBulkOfUpdate(fakerareBurnedAndFormatted, "burned");
		bulkOfUpdateRarepepe.length > 0 && (await updateBulkInDB("rarepepe", bulkOfUpdateRarepepe));
		bulkOfUpdateFakerare.length > 0 && (await updateBulkInDB("fakerare", bulkOfUpdateFakerare));

		return res.status(200).json({
			action: "Update Global Burned",
			NumberOfRarePepeBurned: rarepepeBurnedAndFormatted.length,
			NumberOfFakeRareBurned: fakerareBurnedAndFormatted.length,
			rarepepeBurnedAndFormatted,
			fakerareBurnedAndFormatted,
			succes: true,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).send({
			error,
		});
	}
};

export default handlerBurned;
