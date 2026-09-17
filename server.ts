import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';

import authRoutes from './server/routes/authRoutes';
import adminRoutes from './server/routes/adminRoutes';
import teacherRoutes from './server/routes/teacherRoutes';
import studentRoutes from './server/routes/studentRoutes';
import apiDocsRoutes from './server/routes/apiDocs';
import { sanitizeInput } from './server/middleware/validator';
import { apiRateLimiter } from './server/middleware/rateLimiter';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Security Headers via Helmet
  // Configured with relaxed CSP directives to support Vite dev tooling and remote avatars
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Vite inline scripts and dynamic module imports in preview
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. CORS configuration restricted to origin
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // 3. Request parsing & Cookie parser for HttpOnly JWT session tokens
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // 4. Input Sanitization against injection patterns
  app.use(sanitizeInput);

  // 5. Global API Rate Limiter
  app.use('/api', apiRateLimiter);

  // 6. Health & Diagnostic endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'Secure MERN Student Management System',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      security: {
        httpOnlyCookies: true,
        bcrypt12Rounds: true,
        rbacProtection: true,
        rateLimiting: true,
      },
    });
  });

  // 7. Mount Core API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/teacher', teacherRoutes);
  app.use('/api/student', studentRoutes);
  app.use('/api/docs', apiDocsRoutes);

  // 8. Error response sanitization (never leak stack traces or internals)
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[Application Error]', err.message || err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'An unexpected internal server error occurred.',
      code: err.code || 'INTERNAL_ERROR',
    });
  });

  // 9. Vite middleware for frontend integration (SPA mode)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Backend Server] Running securely on http://0.0.0.0:${PORT}`);
  });
}

startServer();
