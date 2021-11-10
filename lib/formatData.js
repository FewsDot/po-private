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
				name: item.get_asset,
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
				name: item.give_asset,
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
				name: item.get_asset === "XCP" ? item.give_asset : item.get_asset,
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

const formatArbitragesData = (arrayOfArbitrage, BTCActualBlock, collection, cryptoPrices) => {
	const { bitcoin, counterparty, pepecash } = cryptoPrices;
	return arrayOfArbitrage.flatMap((card) => {
		let btcBlock = card.market.dispenser.BTC?.block;
		let pepecashBlock = card.market.dex.PEPECASH?.block;
		let xcpBlock = card.market.dex.XCP?.block;
		let mostRecentBlock =
			btcBlock > pepecashBlock && btcBlock > xcpBlock
				? btcBlock
				: pepecashBlock > btcBlock && pepecashBlock > xcpBlock
				? pepecashBlock
				: xcpBlock > btcBlock && xcpBlock > pepecashBlock && xcpBlock;
		let btcPrice = mostRecentBlock - btcBlock <= 144 ? card.market.dispenser.BTC?.price : 0;
		let pepecashPrice =
			mostRecentBlock - pepecashBlock <= 144 ? card.market.dex.PEPECASH?.price : 0;
		let xcpPrice = mostRecentBlock - xcpBlock <= 144 ? card.market.dex.XCP?.price : 0;

		const hoursSinceLastTx = Math.round((BTCActualBlock - mostRecentBlock) / 6);

		return btcPrice > 0 && pepecashPrice > 0 && xcpPrice > 0
			? {
					collection,
					name: card.name,
					btcValueInUSD: btcPrice * bitcoin.usd,
					pepecashValueInUSD: pepecashPrice * pepecash.usd,
					xcpValueInUSD: xcpPrice * counterparty.usd,
					hoursSinceLastTx,
			  }
			: btcPrice > 0 && pepecashPrice > 0
			? {
					collection,
					name: card.name,
					btcValueInUSD: btcPrice * bitcoin.usd,
					pepecashValueInUSD: pepecashPrice * pepecash.usd,
					hoursSinceLastTx,
			  }
			: btcPrice > 0 && xcpPrice > 0
			? {
					collection,
					name: card.name,
					btcValueInUSD: btcPrice * bitcoin.usd,
					xcpValueInUSD: xcpPrice * counterparty.usd,
					hoursSinceLastTx,
			  }
			: pepecashPrice > 0 && xcpPrice > 0
			? {
					collection,
					name: card.name,
					pepecashValueInUSD: pepecashPrice * pepecash.usd,
					xcpValueInUSD: xcpPrice * counterparty.usd,
					hoursSinceLastTx,
			  }
			: [];
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
					quantity: resultOfEachCard
						.flatMap((item) => (item.status === "valid" ? parseInt(item.quantity) : []))
						.reduce((a, b) => a + b),
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
	formatArbitragesData,
	getMostRecentTxAndPrice,
	getArrayOfResultFromXChain,
};
