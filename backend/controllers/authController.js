import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs'
import generateToken from '../utils/generateToken.js'
import User from '../models/userModel.js';



//@desc Auth user & get token
//@route POST  /mvgr-lms/api/auth/login
//@access Public
const authUser = asyncHandler(async (req, res) => {
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
            res.status(400);
            throw new Error('Incorrect password');
        }
    }
    else {
        res.status(404)
        throw new Error('User not found')
    }
})

//@desc Register a new user - teacher / student.
//@route POST  /mvgr-lms/api/auth/register
//@access Public

const registerUser = asyncHandler(async (req, res) => {

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
        res.status(400);
        throw new Error('User already exits');
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
        res.status(400);
        throw new Error('Invalid user data')
    }
});

//@desc Bulk registration of students or teachers.
//@route POST /mvgr-lms/auth/register-bulk.
//@access Private
const bulkRegisterUsers = asyncHandler(async (req, res) => {
    //yet to decide which format the data will be passed to the server.
})

export { authUser, registerUser }