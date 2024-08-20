import express from 'express';
import { authUser, registerUser, validateToken, codeStatusUtil } from '../controllers/authController.js'

const router = express.Router()

router.post('/login', authUser)
router.post('/register', registerUser)
router.post('/validate_token', validateToken)
router.get("/code-validity",codeStatusUtil);
export default router;