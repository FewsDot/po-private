const getUpdateDependingType = (type, item, now = 0) => {
	return type === "markets"
		? {
				$set:
					item.asset === "PEPECASH"
						? {
								"market.dex.lastUpdate": now,
								"market.dex.PEPECASH.price": item.price,
								"market.dex.PEPECASH.block": item.block,
						  }
						: {
								"market.dex.lastUpdate": now,
								"market.dex.XCP.price": item.price,
								"market.dex.XCP.block": item.block,
						  },
		  }
		: type === "dispenses"
		? {
				$set: {
					"market.dispenser.lastUpdate": now,
					"market.dispenser.BTC.price": item.price,
					"market.dispenser.BTC.block": item.block,
				},
		  }
		: type === "highestValue"
		? {
				$set: { "market.lastValueInUSD": item.value },
		  }
		: type === "burned"
		? {
				$set: { burned: item.quantity, lastBurn: item.block_index },
		  }
		: type === "destructions"
		? { $set: { destructed: item.quantity } }
		: type === "issuances" && {
				$set: { quantity: item.quantity },
		  };
};

const getBulkOfUpdate = (arrayOfUpdate, type, now) => {
	return arrayOfUpdate.map((item) => {
		return {
			updateOne: {
				filter: { name: item.name },
				update: getUpdateDependingType(type, item, now),
			},
		};
	});
};

export { getBulkOfUpdate };
