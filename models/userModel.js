import mongoose from 'mongoose'

const userSchema = mongoose.Schema({
    fname: {
        type: String,
        required: true
    },
    lname: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        enum: ['CSE', 'ECE', 'EEE', 'CIV', 'MEC', 'CHEM'], //RESTRICTED TO ONLY THESE BRANCHES - IF NOT FEASIBLE HERE WE CAN RESTRICT IN CLIENT SIDE AS WELL.   
        requierd: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    dob: {
        type: Date,
        required: false
    },
    regd: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    isCr: {
        type: Boolean,
        default: false,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true
})

const User = mongoose.model('users', userSchema)
export default User;