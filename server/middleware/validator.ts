import { Request, Response, NextFunction } from 'express';

// Sanitizes objects recursively to prevent NoSQL injection patterns
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  function clean(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(clean);

    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      // Reject MongoDB operator injection keys ($gt, $ne, $regex, etc.)
      if (key.startsWith('$')) {
        continue;
      }
      cleaned[key] = clean(obj[key]);
    }
    return cleaned;
  }

  if (req.body) req.body = clean(req.body);
  if (req.query) req.query = clean(req.query);
  next();
}

export function validateRegister(req: Request, res: Response, next: NextFunction) {
  const { name, email, password, role } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    res.status(400).json({ success: false, message: 'Valid full name (minimum 2 characters) is required.' });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.toLowerCase())) {
    res.status(400).json({ success: false, message: 'Valid email address is required.' });
    return;
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long and contain numbers or symbols.',
    });
    return;
  }

  const allowedRoles = ['admin', 'teacher', 'student'];
  if (role && !allowedRoles.includes(role)) {
    res.status(400).json({ success: false, message: 'Role must be admin, teacher, or student.' });
    return;
  }

  next();
}

export function validateLogin(req: Request, res: Response, next: NextFunction) {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Both email and password are required.' });
    return;
  }
  next();
}
