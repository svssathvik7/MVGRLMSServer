import mongoose from 'mongoose'
import ConfigModel from "../models/configModel.js";
import bcrypt from "bcryptjs";
const connectDB = async () => {
	try {
		const conn = await mongoose.connect(process.env.MONGO_URI);
		const isFirstStart = await ConfigModel.findOne({});
		if(!isFirstStart){
			const salt = bcrypt.genSaltSync(10);
        	const hashKey = bcrypt.hashSync(process.env.MONGO_URI, salt);
			const setConfig = await new ConfigModel({
				unique_code : hashKey,
				code_expiry : false
			});
			await setConfig.save();
		}
		console.log(`MongoDB Connect: ${conn.connection.host}`)
	}
	catch (error) {
		console.error(`Error: ${error.message}`)
		process.exit(1)
	}
}

export default connectDB;