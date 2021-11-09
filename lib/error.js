const throwerError = (problemType, errorMessage) => {
	throw { status: "Error", step: problemType, details: errorMessage };
};

const handlerErrorAxios = (error) => {
	return { status: error.response.status, data: error.response.data, message: error.message };
};

export { throwerError, handlerErrorAxios };
