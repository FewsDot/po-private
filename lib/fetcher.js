import axios from "axios";
import { throwerError, handlerErrorAxios } from "./error.js";

const getBTCBlockchainData = async (block) => {
	try {
		return await axios({
			method: "get",
			url: block
				? `https://api.blockcypher.com/v1/btc/main/blocks/${block}` // give data on block like date
				: "https://api.blockcypher.com/v1/btc/main",
		});
	} catch (error) {
		throwerError("Fetch BlockCypher API - Axios", handlerErrorAxios(error));
	}
};

const getBase64 = async (imgURL) => {
	try {
		return axios
			.get(imgURL, {
				responseType: "arraybuffer",
			})
			.then((response) => Buffer.from(response.data, "binary").toString("base64"));
	} catch (error) {
		throwerError("Fetch External Image - Axios", handlerErrorAxios(error));
	}
};

const getAssetFromXchain = async (asset, type) => {
	try {
		return await axios({
			method: "get",
			url: `https://www.xchain.io/api/${type}/${asset}`,
		});
	} catch (error) {
		throwerError("Fetch XCHAIN API - Axios", handlerErrorAxios(error));
	}
};

const getCryptosPrices = async () => {
	try {
		return await axios({
			method: "get",
			url: `https://api.coingecko.com/api/v3/simple/price?ids=counterparty,bitcoin,pepecash&vs_currencies=usd`,
		});
	} catch (error) {
		throwerError("Fetch Coingecko API - Axios", handlerErrorAxios(error));
	}
};

const fetchCounterparty = async (request, type) => {
	try {
		const response = await axios({
			method: "post",
			url: "http://api.counterparty.io:4000/",
			data: JSON.stringify(request),
			headers: { "Content-Type": "application/json", Authorization: "Basic cnBjOnJwYw==" },
			keepalive: true,
		});

		if (response.data.error) {
			throw { type: type, step: "response", error: response.data.error };
		}
		return response.data.result;
	} catch (error) {
		error.step === "response"
			? throwerError("Fetch Counterparty API", error)
			: throwerError(
					`Fetch Counterparty API - Axios - Type Of Request: ${type}`,
					handlerErrorAxios(error)
			  );
	}
};

export { getBTCBlockchainData, getBase64, getAssetFromXchain, fetchCounterparty, getCryptosPrices };
