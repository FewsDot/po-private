const getGlobalMarketCap = (array) => {
	return array
		.map((card) => {
			const realSupply = card.quantity - (card.burned + card.destructed);
			const lastValue = card.market.lastValueInUSD;
			const total = lastValue * realSupply;
			return Math.round(total);
		})
		.reduce((a, b) => a + b);
};
const getSupplyData = (array) => {
	const totalSupply = array.map((card) => card.quantity).reduce((a, b) => a + b);
	const totalBurned = array.map((card) => card.burned).reduce((a, b) => a + b);
	const totalDestructed = array.map((card) => card.destructed).reduce((a, b) => a + b);
	const realSupply = totalSupply - (totalBurned + totalDestructed);
	const percentOfRealSupply = (realSupply * 100) / totalSupply;

	return {
		totalSupply,
		totalBurned,
		totalDestructed,
		realSupply,
		percentOfRealSupply,
	};
};
export { getGlobalMarketCap, getSupplyData };
