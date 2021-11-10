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

const getLastArbitrages = (timeBlock) => {
	return {
		query: {
			$and: [
				{
					"market.dispenser.BTC.price": { $gt: 0 },
					"market.dispenser.BTC.block": { $gt: timeBlock },
				},
				{
					$or: [
						{
							"market.dex.XCP.price": { $gt: 0 },
							"market.dex.XCP.block": { $gt: timeBlock },
						},
						{
							"market.dex.PEPECASH.price": { $gt: 0 },
							"market.dex.PEPECASH.block": { $gt: timeBlock },
						},
					],
				},
			],
		},
		projection: { _id: 0, divisible: 0, issuer: 0 },
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

export { getLastArbitrages, getBulkOfUpdate };
