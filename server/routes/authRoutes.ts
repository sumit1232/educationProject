import { Router } from 'express';
import {
  register,
  verifySignupOtp,
  login,
  requestOtpLogin,
  verifyOtpLogin,
  googleOAuthLogin,
  forgotPassword,
  resetPassword,
  handleRefreshToken,
  logout,
  getMe,
  updateProfile,
  fetchEmailLogs,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';
import { validateRegister, validateLogin } from '../middleware/validator';

const router = Router();

// Public auth endpoints protected by authRateLimiter
router.post('/register', authRateLimiter, validateRegister, register);
router.post('/verify-otp-signup', authRateLimiter, verifySignupOtp);
router.post('/login', authRateLimiter, validateLogin, login);
router.post('/request-otp-login', authRateLimiter, requestOtpLogin);
router.post('/verify-otp-login', authRateLimiter, verifyOtpLogin);
router.post('/google', authRateLimiter, googleOAuthLogin);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);
router.post('/refresh', handleRefreshToken);
router.post('/logout', logout);

// Protected session endpoints
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);

// Inspection utility for previewing simulated OTP emails in development UI
router.get('/email-logs', fetchEmailLogs);

export default router;
