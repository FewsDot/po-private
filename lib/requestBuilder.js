const requestBuilder = (method, params) => {
	return {
		method: method,
		params: params,
		jsonrpc: "2.0",
		id: 0,
	};
};

export { requestBuilder };
