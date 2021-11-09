import { MongoClient } from "mongodb";
import { throwerError } from "./error.js";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

const createInDB = async (collectionName, data) => {
	!MONGODB_URI && throwerError("database-env", "Please define MONGODB_URI env variable !");
	!MONGODB_DB && throwerError("database-env", "Please define MONGODB_DB env variable !");
	const opts = {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	};

	try {
		const client = await MongoClient.connect(MONGODB_URI, opts);
		const collection = client.db(MONGODB_DB).collection(collectionName);
		const result = await collection.insertOne(data);
		return result;
	} catch (error) {
		if (error instanceof MongoServerError) {
			console.log(`Error worth logging: ${error}`); // special case for some reason
		}
		throw error; // still want to crash
	}
};

const updateBulkInDB = async (collectionName, bulk) => {
	!MONGODB_URI && throwerError("database-env", "Please define MONGODB_URI env variable !");
	!MONGODB_DB && throwerError("database-env", "Please define MONGODB_DB env variable !");
	const opts = {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	};

	try {
		const client = await MongoClient.connect(MONGODB_URI, opts);
		const collection = client.db(MONGODB_DB).collection(collectionName);
		const result = await collection.bulkWrite(bulk);
		return result;
	} catch (error) {
		console.log(`Error worth logging: ${error}`); // special case for some reason
		return; // still want to crash
	}
};

const getManyInDB = async (collectionName, query, options) => {
	!MONGODB_URI && throwerError("database-env", "Please define MONGODB_URI env variable !");
	!MONGODB_DB && throwerError("database-env", "Please define MONGODB_DB env variable !");
	const opts = {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	};

	try {
		const client = await MongoClient.connect(MONGODB_URI, opts);
		const collection = client.db(MONGODB_DB).collection(collectionName);
		const result = collection.find(query, options);
		return result.toArray();
	} catch (error) {
		console.log(`Error worth logging: ${error}`); // special case for some reason
		return; // still want to crash
	}
};

export { createInDB, updateBulkInDB, getManyInDB };
