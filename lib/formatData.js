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

const getOrderFormattedByType = (order, type) => {
	const { give_quantity, give_asset, get_quantity, get_asset, block_index } = order;
	const giveQuantity =
		type === "PPCXCP" || type === "XCPPPC" || type === "PPCRPP" || type === "XCPRPP"
			? give_quantity / 100000000
			: give_quantity;
	const getQuantity =
		type === "PPCXCP" || type === "XCPPPC" || type === "RPPPPC" || type === "RPPXCP"
			? get_quantity / 100000000
			: get_quantity;

	const name = type === "XCPRPP" || type === "XCPPPC" || type === "PPCRPP" ? get_asset : give_asset;
	const asset =
		type === "XCPRPP" || type === "XCPPPC" || type === "PPCRPP" ? give_asset : get_asset;

	const price =
		type === "XCPRPP" || type === "XCPPPC" || type === "PPCRPP"
			? giveQuantity / getQuantity
			: getQuantity / giveQuantity;
	return {
		name,
		asset,
		price,
		block: block_index,
	};
};

const formatAndSortAllArrayOfOrders = (arrays) => {
	const ArraysFiltred = arrays.filter((array) => array.length > 0).map((item) => item);
	let result = [];
	ArraysFiltred.forEach((item) => {
		return item.forEach((subItem) => result.push(subItem));
	});

	return result.sort((a, b) => (a.block > b.block ? 1 : b.block > a.block ? -1 : 0));
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
		const { name, block_index, series, order, quantity, burned, img_url, market, destructed } =
			card;
		let btcBlock = market.dispenser.BTC?.block;
		let pepecashBlock = market.dex.PEPECASH?.block;
		let xcpBlock = market.dex.XCP?.block;
		let mostRecentBlock =
			btcBlock > pepecashBlock && btcBlock > xcpBlock
				? btcBlock
				: pepecashBlock > btcBlock && pepecashBlock > xcpBlock
				? pepecashBlock
				: xcpBlock > btcBlock && xcpBlock > pepecashBlock && xcpBlock;
		let btcPrice =
			mostRecentBlock - btcBlock <= 144 ? market.dispenser.BTC?.price * bitcoin.usd : 0;
		let pepecashPrice =
			mostRecentBlock - pepecashBlock <= 144 ? market.dex.PEPECASH?.price * pepecash.usd : 0;
		let xcpPrice = mostRecentBlock - xcpBlock <= 144 ? market.dex.XCP?.price * counterparty.usd : 0;
		const hoursSinceLastTx = Math.round((BTCActualBlock - mostRecentBlock) / 6);

		return btcPrice > 0 && pepecashPrice > 0 && xcpPrice > 0
			? {
					collection,
					name,
					btcPrice,
					pepecashPrice,
					xcpPrice,
					spread:
						((Math.min(btcPrice, pepecashPrice, xcpPrice) -
							Math.max(btcPrice, pepecashPrice, xcpPrice)) /
							Math.max(btcPrice, pepecashPrice, xcpPrice)) *
						100,
					hoursSinceLastTx,
					block_index,
					series,
					order,
					quantity,
					burned,
					img_url,
					destructed,
			  }
			: btcPrice > 0 && pepecashPrice > 0
			? {
					collection,
					name,
					btcPrice,
					pepecashPrice,
					spread:
						((Math.min(btcPrice, pepecashPrice) - Math.max(btcPrice, pepecashPrice)) /
							Math.max(btcPrice, pepecashPrice)) *
						100,
					hoursSinceLastTx,
					block_index,
					series,
					order,
					quantity,
					burned,
					img_url,
					destructed,
			  }
			: btcPrice > 0 && xcpPrice > 0
			? {
					collection,
					name,
					btcPrice,
					xcpPrice,
					spread:
						((Math.min(btcPrice, xcpPrice) - Math.max(btcPrice, xcpPrice)) /
							Math.max(btcPrice, xcpPrice)) *
						100,
					hoursSinceLastTx,
					block_index,
					series,
					order,
					quantity,
					burned,
					img_url,
					destructed,
			  }
			: pepecashPrice > 0 && xcpPrice > 0
			? {
					collection,
					name,
					pepecashPrice,
					xcpPrice,
					spread:
						((Math.min(pepecashPrice, xcpPrice) - Math.max(pepecashPrice, xcpPrice)) /
							Math.max(pepecashPrice, xcpPrice)) *
						100,
					hoursSinceLastTx,
					block_index,
					series,
					order,
					quantity,
					burned,
					img_url,
					destructed,
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
	getOrderFormattedByType,
	formatAndSortAllArrayOfOrders,
	formatDispenserLastSales,
	formatArbitragesData,
	getMostRecentTxAndPrice,
	getArrayOfResultFromXChain,
};
