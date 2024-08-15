import mongoose from "mongoose";
const configSchema = new mongoose.Schema({
    unique_code : {
        type : String,
        required : true
    },
    code_expiry : {
        type : Boolean,
        default : false
    }
});
const ConfigModel = new mongoose.model("config",configSchema);
export default ConfigModel;