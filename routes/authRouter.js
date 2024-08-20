import express from 'express';
import { authUser, registerUser, validateToken } from '../controllers/authController.js'

const router = express.Router()

router.post('/login', authUser)
router.post('/register', registerUser)
router.post('/validate_token', validateToken)

export default router;