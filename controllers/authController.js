import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs'
import generateToken from '../utils/generateToken.js'
import User from '../models/userModel.js';
import ConfigModel from '../models/configModel.js';



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
//@route POST in register call (bulk is set to false i.e internal api redirect)
//@access Private

const singleRegistration = asyncHandler(async(req,res)=>{
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
})

//@desc Redirect a new user - teacher / student data based on the data density.
//@route POST  /mvgr-lms/api/auth/register
//@access Public

const registerUser = asyncHandler(async (req, res) => {
    const {bulk, faculty_email} = req.body;
    var config = await ConfigModel.findOne({});
    const {isadmin} = req.body;
    if (!config.code_expiry) {
        if(!isadmin){
            return res.status(400).json({message:"Only you can register a faculty/admin firsly!"});
        }
        const {pass_key} = req.body;
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
            return res.status(400).json({message: "Wrong pass key!"});
        }
    }
    
    try {
        const facultyMatch = await User.findOne({email: faculty_email});
        
        if (facultyMatch) {
            if (bulk === "true") {
                return bulkRegisterUsers(req, res);
            }
            if (bulk === "false") {
                return singleRegistration(req, res);
            }
        } else {
            throw new Error("Invalid Faculty Email");
        }
    } catch (error) {
        console.log("Invalid Registering Faculty!");
        return res.status(401).json({message: "Unauthorized access!"});
    }
});


//@desc Bulk registration of students or teachers.
//@route POST in register call (bulk is set to true i.e internal api redirect)
//@access Private

const bulkRegisterUsers = asyncHandler(async (req, res) => {
    //format field decides on what way the data has to be parsed for now the allowed format types are csv,excel,json
    const {format} = req.body;
    if(format == "csv"){

    }
});

export { authUser, registerUser };