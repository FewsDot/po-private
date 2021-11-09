const filterResponseByTypeOfCards = (data, listOfCards) => {
	return data.filter((item) => listOfCards.indexOf(item.asset) > -1);
};
const filterResponseMarkets = (data, listOfCards) => {
	return data.filter(
		(item) => listOfCards.indexOf(item.give_asset) > -1 || listOfCards.indexOf(item.get_asset) > -1
	);
};

const formatDivisibleNumberFromArray = (arrayOfBurns, listOfDivisibleCard) => {
	return arrayOfBurns.map((item) => {
		return {
			name: item.name,
			quantity:
				listOfDivisibleCard.indexOf(item.name) > -1 ? item.quantity / 100000000 : item.quantity,
		};
	});
};

const filterResponseBurned = (arrayOfBurn) => {
	return arrayOfBurn
		.map((burn) => {
			return {
				name: burn.asset,
				quantity: arrayOfBurn
					.filter((item) => burn.asset === item.asset)
					.map((item) => item.quantity)
					.reduce((a, b) => a + b),
			};
		})
		.filter((v, i, a) => a.findIndex((t) => JSON.stringify(t) === JSON.stringify(v)) === i);
};

const buildMultiFiltersRequest = (data, field, value) => {
	return data.map((item) => ({
		field: field,
		op: "==",
		value: value === "dispensers" ? item.dispenser_tx_hash : item,
	}));
};

const getResponseParsedForRarepepe = (array) => {
	return array.flatMap((item) => {
		if (
			(item.give_asset === "XCP" && item.get_asset === "PEPECASH") ||
			(item.give_asset === "XCP" && item.get_asset !== "PEPECASH") ||
			(item.give_asset === "PEPECASH" && item.get_asset !== "XCP")
		) {
			return {
				card: item.get_asset,
				asset: item.give_asset,
				price: item.give_quantity / item.get_quantity / 100000000,
				block: item.block_index,
			};
		} else if (
			(item.give_asset === "PEPECASH" && item.get_asset === "XCP") ||
			(item.give_asset !== "PEPECASH" && item.get_asset === "XCP") ||
			(item.give_asset !== "XCP" && item.get_asset === "PEPECASH")
		) {
			return {
				card: item.give_asset,
				asset: item.get_asset,
				price: item.get_quantity / item.give_quantity / 100000000,
				block: item.block_index,
			};
		} else return [];
	});
};
const getResponseParsedForFakerare = (array) => {
	return array.flatMap((item) => {
		if (item.get_asset === "XCP" || item.give_asset === "XCP") {
			return {
				card: item.get_asset === "XCP" ? item.give_asset : item.get_asset,
				asset: "XCP",
				price: item.give_quantity / item.get_quantity / 100000000,
				block: item.block_index,
			};
		} else return [];
	});
};

const formatDispenserLastSales = (data, arrayOfBlockIndexDispenses) => {
	return data.map((item) => {
		let mostRecentBlockIndexDispense = arrayOfBlockIndexDispenses.flatMap((dispense) =>
			dispense.asset === item.asset ? dispense.block_index : []
		);
		return {
			name: item.asset,
			price: item.satoshirate / 100000000,
			block: mostRecentBlockIndexDispense[0],
		};
	});
};

const getMostRecentTxAndPrice = (arrayOfCards, cryptoPrices) => {
	const { bitcoin, counterparty, pepecash } = cryptoPrices;
	return arrayOfCards.map((card) => {
		const btcLastTx = card.market.dispenser?.BTC.block ? card.market.dispenser.BTC.block : 0;
		const xcpLastTx = card.market.dex?.XCP.block ? card.market.dex.XCP.block : 0;
		const pepecashLastTx = card.market.dex?.PEPECASH.block ? card.market.dex.PEPECASH.block : 0;
		const btcValueInUSD = card.market.dispenser?.BTC.price
			? card.market.dispenser.BTC.price * bitcoin.usd
			: 0;
		const xcpValueInUSD = card.market.dex?.XCP.price
			? card.market.dex.XCP.price * counterparty.usd
			: 0;
		const pepecashValueInUSD = card.market.dex?.PEPECASH.price
			? card.market.dex.PEPECASH.price * pepecash.usd
			: 0;

		return {
			name: card.name,
			value:
				btcLastTx > xcpLastTx && btcLastTx > pepecashLastTx
					? btcValueInUSD
					: xcpLastTx > btcLastTx && xcpLastTx > pepecashLastTx
					? xcpValueInUSD
					: pepecashLastTx > btcLastTx && pepecashLastTx > xcpLastTx
					? pepecashValueInUSD
					: btcValueInUSD > xcpValueInUSD && btcValueInUSD > pepecashValueInUSD
					? btcValueInUSD
					: xcpValueInUSD > btcValueInUSD && xcpValueInUSD > pepecashValueInUSD
					? xcpValueInUSD
					: pepecashValueInUSD > btcValueInUSD && pepecashValueInUSD > xcpValueInUSD
					? pepecashValueInUSD
					: 0,
		};
	});
};

const getArrayOfResultFromXChain = async (collection, fetcher, type) => {
	return await Promise.all(
		collection.map(async (item) => {
			const response = await fetcher(item, type);
			const resultOfEachCard = response.data.data;
			if (resultOfEachCard.length > 0) {
				return {
					name: resultOfEachCard[0].asset,
					quantity: resultOfEachCard.map((item) => parseInt(item.quantity)).reduce((a, b) => a + b),
				};
			} else {
				return { name: item, quantity: 0 };
			}
		})
	);
};

export {
	filterResponseByTypeOfCards,
	filterResponseMarkets,
	formatDivisibleNumberFromArray,
	filterResponseBurned,
	buildMultiFiltersRequest,
	getResponseParsedForRarepepe,
	getResponseParsedForFakerare,
	formatDispenserLastSales,
	getMostRecentTxAndPrice,
	getArrayOfResultFromXChain,
};
