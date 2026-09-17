import { Router, Request, Response } from 'express';

const router = Router();

export const POSTMAN_COLLECTION = {
  info: {
    name: 'Secure MERN Student Management System API',
    description:
      'Complete Postman Collection for authentication, RBAC authorization, Admin, Teacher, and Student operations.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: [
    {
      name: 'Authentication',
      item: [
        {
          name: '1. Register User (bcrypt 12 rounds + OTP dispatch)',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  name: 'Jordan Smith',
                  email: 'jordan@school.edu',
                  password: 'StrongPassword123!',
                  role: 'student',
                },
                null,
                2
              ),
            },
            url: { raw: '{{baseUrl}}/api/auth/register' },
          },
        },
        {
          name: '2. Verify OTP Signup',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ email: 'jordan@school.edu', otp: '123456' }, null, 2),
            },
            url: { raw: '{{baseUrl}}/api/auth/verify-otp-signup' },
          },
        },
        {
          name: '3. Login (Email + Password)',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ email: 'admin@school.edu', password: 'Admin123!' }, null, 2),
            },
            url: { raw: '{{baseUrl}}/api/auth/login' },
          },
        },
        {
          name: '4. Token Refresh (Rotate Tokens)',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            url: { raw: '{{baseUrl}}/api/auth/refresh' },
          },
        },
        {
          name: '5. Current User Profile (/me)',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: { raw: '{{baseUrl}}/api/auth/me' },
          },
        },
      ],
    },
    {
      name: 'Admin Operations (RBAC: admin)',
      item: [
        {
          name: 'Get Admin Statistics',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: { raw: '{{baseUrl}}/api/admin/stats' },
          },
        },
        {
          name: 'Get All Users',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: { raw: '{{baseUrl}}/api/admin/users' },
          },
        },
        {
          name: 'Get Security Audit Logs',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: { raw: '{{baseUrl}}/api/admin/audit-logs' },
          },
        },
      ],
    },
    {
      name: 'Teacher Operations (RBAC: teacher, admin)',
      item: [
        {
          name: 'Get Teacher Classes',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: { raw: '{{baseUrl}}/api/teacher/classes' },
          },
        },
        {
          name: 'Save Batch Attendance',
          request: {
            method: 'POST',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{accessToken}}' },
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  classId: 'cls-01',
                  date: '2026-09-17',
                  records: [
                    { studentId: 'std-01', studentName: 'Alex Rivera', status: 'Present' },
                    { studentId: 'std-02', studentName: 'Chloe Zhao', status: 'Present' },
                  ],
                },
                null,
                2
              ),
            },
            url: { raw: '{{baseUrl}}/api/teacher/attendance' },
          },
        },
      ],
    },
    {
      name: 'Student Operations (RBAC: student, admin, teacher)',
      item: [
        {
          name: 'Get Student Dashboard & Grades',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: { raw: '{{baseUrl}}/api/student/dashboard' },
          },
        },
        {
          name: 'Submit Assignment Solution',
          request: {
            method: 'POST',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{accessToken}}' },
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  assignmentId: 'asg-01',
                  solutionNotes: 'Completed binary tree and graph traversal proofs.',
                  fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
                },
                null,
                2
              ),
            },
            url: { raw: '{{baseUrl}}/api/student/assignments/submit' },
          },
        },
      ],
    },
  ],
};

router.get('/postman-collection.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="mern-student-management-api.postman_collection.json"');
  res.json(POSTMAN_COLLECTION);
});

export default router;
