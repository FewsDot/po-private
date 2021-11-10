import { checkAuthAndRequest } from "lib/checkAuthAndRequest";
import listOfFakerare from "lib/listOfFakerare.js";
import listOfRarepepe from "lib/listOfRarepepe.js";
import { getAssetFromXchain } from "lib/fetcher.js";
import { getArrayOfResultFromXChain } from "lib/formatData.js";
import { getBulkOfUpdate } from "lib/handleMongoRequest";
import { updateBulkInDB } from "lib/handleDB.js";

const handlerDestructions = async (req, res) => {
	try {
		checkAuthAndRequest(req);
		const collection = req.query.collection;
		if (!collection) throw "please provide a collection name";
		const collectionToFetch = collection === "rarepepe" ? listOfRarepepe : listOfFakerare;
		const arrayOfCardsDestructions = await getArrayOfResultFromXChain(
			collectionToFetch,
			getAssetFromXchain,
			"destructions"
		);
		const destructedCardFiltred = arrayOfCardsDestructions.filter((card) => card.quantity > 0);
		const bulkOfUpdate = getBulkOfUpdate(destructedCardFiltred, "destructions");
		await updateBulkInDB(collection, bulkOfUpdate);

		return res.status(200).json({
			action: "Update Destructions",
			NumberOfCard: collectionToFetch.length,
			NumberOfCardToUpdate: destructedCardFiltred.length,
			destructedCardFiltred,
			succes: true,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).send({
			error,
		});
	}
};

export default handlerDestructions;
