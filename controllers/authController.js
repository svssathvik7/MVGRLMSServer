import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs'
import generateToken from '../utils/generateToken.js'
import User from '../models/userModel.js';



//@desc Auth user & get token
//@route POST  /mvgr-lms/api/auth/login
//@access Protected
const authUser = asyncHandler(async (req, res) => {
    try {
        const { regd, password } = req.body;
        const user = await User.findOne({ regd });

        if (user) {
            const hashPassword = user.password;
            const verified = bcrypt.compareSync(password, hashPassword);
            if (verified) {
                return res.status(201).json({
                    user: user,
                    token: generateToken(user._id)
                });
            }
            else {
                console.log('Incorrect password');
                return res.status(400).json({ message: "Incorrect password" });
            }
        }
        else {
            res.status(404).json({ message: "User not found" });
            throw new Error('User not found')
        }
    }
    catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
})

//@desc Register a new user - teacher / student.
//@route POST  /mvgr-lms/api/auth/register
//@access Public

const registerUser = asyncHandler(async (req, res) => {
    const {bulk,faculty_email} = req.body;
    try{
        const facultyMatch = await User.findOne({email : faculty_email})
        if(bulk && facultyMatch){
            return bulkRegisterUsers(req,res);
        }
    }
    catch(error){
        console.log("Invalid Registering Faculty!");
        return res.status(401).json({message:"Unauthorized access!"});
    }
    try {
        const {
            fname,
            lname,
            regd,
            email,
            dob,
            year,
            branch,
            isadmin,
            iscr,
            password,
        } = req.body;

        const userExits = await User.findOne({ regd });

        if (userExits) {
            console.log('User already exists');
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = bcrypt.genSaltSync(10);
        const hashPassword = bcrypt.hashSync(password, salt);

        const user = await User.create({
            fname,
            lname,
            regd,
            email,
            dob,
            year,
            branch,
            isadmin,
            iscr,
            password: hashPassword,
        });

        if (user) {
            return res.status(201).json({
                user: user,
                token: generateToken(user.regd)
            })
        }
        else {
            console.log('Invalid user data')
            return res.status(400).json({ message: "Invalid user data" });
        }
    }
    catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
});

//@desc Bulk registration of students or teachers.
//@route POST /mvgr-lms/auth/register-bulk.
//@access Private

const bulkRegisterUsers = asyncHandler(async (req, res) => {
    //yet to decide which format the data will be passed to the server.
    
})

export { authUser, registerUser };