import jwt from 'jsonwebtoken'
import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs'
import generateToken from '../utils/generateToken.js'
import User from '../models/userModel.js';
import ConfigModel from '../models/configModel.js';
import csv from 'csv-parser';
import XLSX from 'xlsx';
import { Readable } from 'stream';

//@desc A minimalistic utility to check pass-key validity
//@route POST  /mvgr-lms/api/auth/code-validity
//@access Public
const codeStatusUtil = asyncHandler(async(req,res)=>{
    try {
        const configDoc = await ConfigModel.findOne();
        const keyStatus = await configDoc.code_expiry;
        return res.status(200).json({message:"Successful retreival!",isvalid:!keyStatus});
    } catch (error) {
        console.log("Code status util : "+error.message);
        return res.status(500).json({message:error.message,status:fail});
    }
});

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

//@desc Validate the jwt token 
//@route POST  /mvgr-lms/api/auth/validate_token
//@access Protected

const validateToken = asyncHandler(async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token == null) return res.sendStatus(401);

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) return res.status(403).json({ message: "Session Expired. Please log in again." });
            req.user = user;
            return res.status(200).json({ message: "Valid Login Session" });
        });
    }
    catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });

    }
});


//@desc Register a new user - teacher / student.
//@route POST in register call (bulk is set to false i.e internal api redirect)
//@access Private

const singleRegistration = asyncHandler(async (req, res, isBulk) => {
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
            if(!isBulk)
                return res.status(400).json({ message: "User already exists" });
            else
                return
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
            if(!isBulk){
                return res.status(201).json({
                    user: user,
                    token: generateToken(user.regd)
                })
            }
            else{
                return;
            }
        }
        else {
            console.log('Invalid user data')
            if(!isBulk)
                return res.status(400).json({ message: "Invalid user data" });
            else
                return;
        }
    }
    catch (error) {
        console.log(error.message);
        if(!isBulk)
            return res.status(500).json({ message: error.message });
        else    
            return;
    }
})

//@desc Redirect a new user - teacher / student data based on the data density.
//@route POST  /mvgr-lms/api/auth/register
//@access Public

const registerUser = asyncHandler(async (req, res) => {
    const { bulk, faculty_email } = req.body;
    var config = await ConfigModel.findOne({});
    const { isadmin } = req.body;
    if (!config.code_expiry) {
        if (!isadmin) {
            res.status(400).json({ message: "Only you can register a faculty/admin firsly!" });
            return;
        }
        const { pass_key } = req.body;
        const actualPassKey = config.unique_code;

        if (pass_key === actualPassKey) {
            await singleRegistration(req, res);

            // Set code_expiry to true if registration was successful
            if (res.statusCode === 201) {
                config.code_expiry = true;
                await config.save();
            }

            return; // End the request-response cycle
        } else {
            console.log("Wrong pass key!");
            return res.status(400).json({ message: "Wrong pass key!" });
        }
    }

    try {
        const facultyMatch = await User.findOne({ email: faculty_email });
        if (facultyMatch) {
            if (bulk === true) {
                bulkRegisterUsers(req, res);
                return;
            }
            if (bulk === false) {
                console.log('Bulk has been set to false');
                singleRegistration(req, res);
                return;
            }
        } else {
            throw new Error("Invalid Faculty Email");
        }
    } catch (error) {
        console.log("Invalid Registering Faculty!");
        res.status(401).json({ message: "Unauthorized access!" });
        return;
    }
});


//@desc Bulk registration of students or teachers.
//@route POST in register call (bulk is set to true i.e internal api redirect)
//@access Private

const bulkRegisterUsers = asyncHandler(async (req, res) => {
    const { format, data } = req.body;

    try {
        let parsedData = [];

        if (format === 'csv') {
            const readableStream = Readable.from(data);
            readableStream
                .pipe(csv())
                .on('data', (row) => parsedData.push(row))
                .on('end', async () => {
                    await processBulkData(parsedData);
                    return res.status(201).json({ message: 'Bulk registration successful' });
                });
        } else if (format === 'json') {
            if (typeof data === 'string') {
                parsedData = JSON.parse(data);
            }
            else {
                parsedData = data;
            }
            await processBulkData(parsedData);
            return res.status(201).json({ message: 'Bulk registration successful' });
        } else if (format === 'excel') {
            const workbook = XLSX.read(data, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            parsedData = XLSX.utils.sheet_to_json(sheet);
            await processBulkData(parsedData);
            return res.status(201).json({ message: 'Bulk registration successful' });
        } else {
            return res.status(400).json({ message: 'Unsupported format' });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }

    async function processBulkData(users) {
        try {
            for (const userData of users) {
                req.body = userData; // Replacing req.body with the parsed User data
                await singleRegistration(req, res,true); // Call singleRegistration for each user
            }
        }
        catch (error){
            console.log("While bulk: "+error.message);
            return res.status(500).json({ message: error.message });
        }
    }
});

export { authUser, registerUser, validateToken, codeStatusUtil };