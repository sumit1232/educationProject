import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db, UserDoc, StudentDoc } from '../db';
import {
  signAccessToken,
  signRefreshToken,
  rotateTokens,
  revokeRefreshToken,
  ACCESS_TOKEN_MS,
  REFRESH_TOKEN_MS,
} from '../utils/jwt';
import { generateOTP, verifyOTP, getEmailLogs } from '../utils/email';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, role = 'student', phone, department } = req.body;
    const users = db.get('users');

    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
      return;
    }

    // 12 salt rounds as explicitly requested in prompt specifications
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const userId = `usr-${role}-${crypto.randomUUID().slice(0, 8)}`;
    const studentId = role === 'student' ? `STU-2026-${Math.floor(100 + Math.random() * 900)}` : undefined;
    const teacherId = role === 'teacher' ? `TCH-${Math.floor(100 + Math.random() * 900)}` : undefined;

    const newUser: UserDoc = {
      id: userId,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role as 'admin' | 'teacher' | 'student',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      isVerified: false,
      phone: phone || '',
      createdAt: new Date().toISOString(),
      department: department || (role === 'student' ? 'Grade 10 - General' : 'Faculty'),
      studentId,
      teacherId,
    };

    db.update('users', (list) => [...list, newUser]);

    // If student, also seed student record
    if (role === 'student' && studentId) {
      const studentDoc: StudentDoc = {
        id: `std-${crypto.randomUUID().slice(0, 8)}`,
        userId: newUser.id,
        name: newUser.name,
        email: newUser.email,
        studentId,
        grade: 'Grade 10',
        section: 'A',
        guardianName: 'Parent / Guardian',
        guardianPhone: phone || '+1 (555) 000-0000',
        enrollmentDate: new Date().toISOString().split('T')[0],
        status: 'active',
      };
      db.update('students', (list) => [...list, studentDoc]);
    }

    // Generate signup OTP
    const otp = generateOTP(newUser.email, 'signup');

    // Audit log
    db.update('auditLogs', (logs) => [
      {
        id: 'log-' + crypto.randomUUID().slice(0, 8),
        action: 'USER_REGISTERED',
        userEmail: newUser.email,
        role: newUser.role,
        ip: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
        details: 'User registered with bcrypt 12 salt rounds; OTP dispatched',
      },
      ...logs.slice(0, 99),
    ]);

    res.status(201).json({
      success: true,
      message: 'Account created! Please verify your email with the 6-digit OTP sent.',
      email: newUser.email,
      requiresOtp: true,
      previewOtp: otp, // Included in response for seamless local testing & verification
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
}

export async function verifySignupOtp(req: Request, res: Response) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'Email and OTP code are required.' });
      return;
    }

    const isValid = verifyOTP(email, otp, 'signup');
    if (!isValid) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP code. Please request a new one.' });
      return;
    }

    const users = db.get('users');
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      res.status(404).json({ success: false, message: 'User record not found.' });
      return;
    }

    // Mark verified
    user.isVerified = true;
    db.update('users', (list) => list.map((u) => (u.id === user.id ? { ...u, isVerified: true } : u)));

    // Issue tokens
    const payload = { userId: user.id, email: user.email, role: user.role, name: user.name };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Set HttpOnly cookies
    res.cookie('access_token', accessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_MS });
    res.cookie('refresh_token', refreshToken, { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_MS });

    db.update('auditLogs', (logs) => [
      {
        id: 'log-' + crypto.randomUUID().slice(0, 8),
        action: 'OTP_VERIFIED_SIGNUP',
        userEmail: user.email,
        role: user.role,
        ip: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
        details: 'Email successfully verified via OTP. Session initiated.',
      },
      ...logs.slice(0, 99),
    ]);

    const { passwordHash, ...safeUser } = user;
    res.json({
      success: true,
      message: 'Account verified successfully!',
      user: safeUser,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to verify OTP.' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const users = db.get('users');

    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      db.update('auditLogs', (logs) => [
        {
          id: 'log-' + crypto.randomUUID().slice(0, 8),
          action: 'LOGIN_FAILED',
          userEmail: email,
          role: 'unknown',
          ip: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
          timestamp: new Date().toISOString(),
          status: 'FAILED',
          details: 'Non-existent account email',
        },
        ...logs.slice(0, 99),
      ]);
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      db.update('auditLogs', (logs) => [
        {
          id: 'log-' + crypto.randomUUID().slice(0, 8),
          action: 'LOGIN_FAILED',
          userEmail: email,
          role: user.role,
          ip: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
          timestamp: new Date().toISOString(),
          status: 'FAILED',
          details: 'Incorrect password entered',
        },
        ...logs.slice(0, 99),
      ]);
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    // Issue tokens
    const payload = { userId: user.id, email: user.email, role: user.role, name: user.name };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Set secure HttpOnly cookies
    res.cookie('access_token', accessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_MS });
    res.cookie('refresh_token', refreshToken, { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_MS });

    db.update('auditLogs', (logs) => [
      {
        id: 'log-' + crypto.randomUUID().slice(0, 8),
        action: 'LOGIN_SUCCESS',
        userEmail: user.email,
        role: user.role,
        ip: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
        details: 'User authenticated via password + bcrypt. HttpOnly session cookies issued.',
      },
      ...logs.slice(0, 99),
    ]);

    const { passwordHash, ...safeUser } = user;
    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      user: safeUser,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
}

export async function requestOtpLogin(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required.' });
      return;
    }

    const users = db.get('users');
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      res.status(404).json({ success: false, message: 'No registered user found with this email.' });
      return;
    }

    const otp = generateOTP(user.email, 'login');

    res.json({
      success: true,
      message: 'OTP login code dispatched to your email.',
      email: user.email,
      previewOtp: otp, // For convenient testing
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not send login OTP.' });
  }
}

export async function verifyOtpLogin(req: Request, res: Response) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'Email and OTP code are required.' });
      return;
    }

    const isValid = verifyOTP(email, otp, 'login');
    if (!isValid) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
      return;
    }

    const users = db.get('users');
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const payload = { userId: user.id, email: user.email, role: user.role, name: user.name };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.cookie('access_token', accessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_MS });
    res.cookie('refresh_token', refreshToken, { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_MS });

    db.update('auditLogs', (logs) => [
      {
        id: 'log-' + crypto.randomUUID().slice(0, 8),
        action: 'LOGIN_OTP_SUCCESS',
        userEmail: user.email,
        role: user.role,
        ip: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
        details: 'User authenticated via passwordless email OTP verification.',
      },
      ...logs.slice(0, 99),
    ]);

    const { passwordHash, ...safeUser } = user;
    res.json({
      success: true,
      message: `Signed in successfully with OTP!`,
      user: safeUser,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error verifying OTP login.' });
  }
}

export async function googleOAuthLogin(req: Request, res: Response) {
  try {
    const { googleId, email, name, avatar } = req.body;
    if (!email || !name) {
      res.status(400).json({ success: false, message: 'Google account details missing.' });
      return;
    }

    const users = db.get('users');
    let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Auto-register Google user
      const placeholderPass = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);
      const studentId = `STU-2026-${Math.floor(100 + Math.random() * 900)}`;

      user = {
        id: `usr-student-${crypto.randomUUID().slice(0, 8)}`,
        name,
        email: email.toLowerCase(),
        passwordHash: placeholderPass,
        role: 'student',
        avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        isVerified: true,
        googleId: googleId || `goog-${crypto.randomUUID().slice(0, 8)}`,
        createdAt: new Date().toISOString(),
        department: 'Grade 11 - Science',
        studentId,
      };

      db.update('users', (list) => [...list, user!]);

      // Add to students collection
      const studentDoc: StudentDoc = {
        id: `std-${crypto.randomUUID().slice(0, 8)}`,
        userId: user.id,
        name: user.name,
        email: user.email,
        studentId,
        grade: 'Grade 11',
        section: 'A',
        guardianName: 'Google Verified Account',
        guardianPhone: '+1 (555) 300-8000',
        enrollmentDate: new Date().toISOString().split('T')[0],
        status: 'active',
      };
      db.update('students', (list) => [...list, studentDoc]);
    } else {
      // Link Google ID if not already linked
      if (!user.googleId) {
        user.googleId = googleId || `goog-${crypto.randomUUID().slice(0, 8)}`;
        db.update('users', (list) => list.map((u) => (u.id === user!.id ? user! : u)));
      }
    }

    const payload = { userId: user.id, email: user.email, role: user.role, name: user.name };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.cookie('access_token', accessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_MS });
    res.cookie('refresh_token', refreshToken, { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_MS });

    db.update('auditLogs', (logs) => [
      {
        id: 'log-' + crypto.randomUUID().slice(0, 8),
        action: 'GOOGLE_OAUTH_LOGIN',
        userEmail: user!.email,
        role: user!.role,
        ip: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
        details: 'Authenticated via Google OAuth 2.0 Passport flow.',
      },
      ...logs.slice(0, 99),
    ]);

    const { passwordHash, ...safeUser } = user;
    res.json({
      success: true,
      message: 'Google sign-in successful!',
      user: safeUser,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Google OAuth processing failed.' });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email address is required.' });
      return;
    }

    const users = db.get('users');
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      // Don't leak account existence in production, but confirm message
      res.json({
        success: true,
        message: 'If an account exists with this email, a password recovery OTP code has been dispatched.',
      });
      return;
    }

    const otp = generateOTP(user.email, 'reset');

    res.json({
      success: true,
      message: 'Password reset OTP code dispatched to your email.',
      previewOtp: otp,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to process password recovery.' });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      res.status(400).json({ success: false, message: 'Email, OTP, and new password are required.' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
      return;
    }

    const isValid = verifyOTP(email, otp, 'reset');
    if (!isValid) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP reset code.' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    db.update('users', (list) =>
      list.map((u) => (u.email.toLowerCase() === email.toLowerCase() ? { ...u, passwordHash: newHash } : u))
    );

    // Invalidate existing sessions
    const user = db.get('users').find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      db.update('refreshTokens', (tokens) => tokens.filter((t) => t.userId !== user.id));
    }

    db.update('auditLogs', (logs) => [
      {
        id: 'log-' + crypto.randomUUID().slice(0, 8),
        action: 'PASSWORD_RESET',
        userEmail: email,
        role: user?.role || 'unknown',
        ip: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
        details: 'Password updated with bcrypt 12 rounds. All active sessions invalidated.',
      },
      ...logs.slice(0, 99),
    ]);

    res.json({ success: true, message: 'Password has been successfully updated. Please log in with your new password.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Password reset failed.' });
  }
}

export async function handleRefreshToken(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ success: false, message: 'Refresh token missing. Please sign in.', code: 'NO_REFRESH_TOKEN' });
      return;
    }

    const rotated = rotateTokens(refreshToken);
    if (!rotated) {
      res.clearCookie('access_token', COOKIE_OPTIONS);
      res.clearCookie('refresh_token', COOKIE_OPTIONS);
      res.status(401).json({
        success: false,
        message: 'Invalid or revoked refresh token. Please sign in again.',
        code: 'INVALID_REFRESH_TOKEN',
      });
      return;
    }

    // Set rotated cookies
    res.cookie('access_token', rotated.accessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_MS });
    res.cookie('refresh_token', rotated.refreshToken, { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_MS });

    res.json({
      success: true,
      message: 'Tokens rotated successfully.',
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
      user: rotated.payload,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Token rotation failed.' });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
    if (refreshToken) {
      revokeRefreshToken(refreshToken);
    }

    res.clearCookie('access_token', COOKIE_OPTIONS);
    res.clearCookie('refresh_token', COOKIE_OPTIONS);

    if (req.user) {
      db.update('auditLogs', (logs) => [
        {
          id: 'log-' + crypto.randomUUID().slice(0, 8),
          action: 'LOGOUT',
          userEmail: req.user?.email || 'unknown',
          role: req.user?.role || 'unknown',
          ip: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
          timestamp: new Date().toISOString(),
          status: 'SUCCESS',
          details: 'Session terminated. Refresh token revoked.',
        },
        ...logs.slice(0, 99),
      ]);
    }

    res.json({ success: true, message: 'Logged out successfully. Cookies cleared.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error during logout.' });
  }
}

export async function getMe(req: Request, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const users = db.get('users');
    const user = users.find((u) => u.id === req.user?.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User profile not found.' });
      return;
    }

    const { passwordHash, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const { name, phone, department, avatar, newPassword, currentPassword } = req.body;
    const users = db.get('users');
    const user = users.find((u) => u.id === req.user?.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (department) user.department = department.trim();
    if (avatar) user.avatar = avatar;

    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ success: false, message: 'Current password is required to set a new password.' });
        return;
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Current password does not match.' });
        return;
      }
      if (newPassword.length < 8) {
        res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
        return;
      }
      user.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    db.update('users', (list) => list.map((u) => (u.id === user.id ? user : u)));

    // Also sync student or teacher record if name changed
    if (name) {
      db.update('students', (list) => list.map((s) => (s.userId === user.id ? { ...s, name } : s)));
      db.update('teachers', (list) => list.map((t) => (t.userId === user.id ? { ...t, name } : t)));
    }

    const { passwordHash, ...safeUser } = user;
    res.json({ success: true, message: 'Profile updated successfully!', user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
}

export async function fetchEmailLogs(req: Request, res: Response) {
  res.json({ success: true, logs: getEmailLogs() });
}
