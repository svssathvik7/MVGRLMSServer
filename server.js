import dotenv from 'dotenv';
import express from 'express';
import cors from "cors";
import connectDB from './config/db.js';
import authRouter from './routes/authRouter.js';
import courseRoutes from './routes/courseRoutes.js';
dotenv.config()

connectDB()

const app = express()

app.use(cors());
app.use(express.json()); //middleware

app.get('/', (req, res) => {
	res.send("Let's goo!!");
});

app.use('/mvgr-lms/api/auth', authRouter);
app.use('/api/course', courseRoutes);

const port = 8000 || process.env.PORT;

app.listen(port, () => {
	console.log(`Listening to port ${port}`);
});