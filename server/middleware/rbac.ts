import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db } from '../db';

export function authorizeRoles(...allowedRoles: Array<'admin' | 'teacher' | 'student'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Record security audit log for forbidden access attempt
      db.update('auditLogs', (logs) => [
        {
          id: 'log-' + crypto.randomUUID().slice(0, 8),
          action: 'RBAC_ACCESS_DENIED',
          userEmail: req.user?.email || 'unknown',
          role: req.user?.role || 'unknown',
          ip: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
          timestamp: new Date().toISOString(),
          status: 'WARNING',
          details: `Attempted access to ${req.originalUrl} requiring [${allowedRoles.join(', ')}]`,
        },
        ...logs.slice(0, 99),
      ]);

      res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted. Role '${req.user.role}' is not authorized for this resource.`,
        code: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
}
