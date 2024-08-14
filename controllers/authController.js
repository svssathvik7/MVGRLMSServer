import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs'
import generateToken from '../utils/generateToken.js'
import User from '../models/userModel.js';



//@desc Auth user & get token
//@route POST  /mvgr-lms/api/auth/login
//@access Public
const authUser = asyncHandler(async (req, res) => {
    try {
        const { regd, password } = req.body;
        const user = await User.findOne({ regd });

        if (user) {
            const hashPassword = user.password;
            const verified = bcrypt.compareSync(password, hashPassword);
            if (verified) {
                res.status(201).json({
                    user: user,
                    token: generateToken(user._id)
                });
            }
            else {
                res.status(400).json({ message: "Incorrect password" });
                throw new Error('Incorrect password');
            }
        }
        else {
            res.status(404).json({ message: "User not found" });
            throw new Error('User not found')
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
        throw new Error(error.message);
    }
})

//@desc Register a new user - teacher / student.
//@route POST  /mvgr-lms/api/auth/register
//@access Public

const registerUser = asyncHandler(async (req, res) => {
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
            res.status(400).json({ message: "User already exists" });
            throw new Error('User already exists');
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
            res.status(201).json({
                user: user,
                token: generateToken(user.regd)
            })
        }
        else {
            res.status(400).json({ message: "Invalid user data" });
            throw new Error('Invalid user data')
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
        throw new Error(error.message);
    }
});

//@desc Bulk registration of students or teachers.
//@route POST /mvgr-lms/auth/register-bulk.
//@access Private

const bulkRegisterUsers = asyncHandler(async (req, res) => {
    //yet to decide which format the data will be passed to the server.
})

export { authUser, registerUser };