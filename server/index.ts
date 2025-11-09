import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.NODE_ENV === 'production'
  ? Number(process.env.PORT)
  : Number(process.env.PORT || 4000);
const HOST = process.env.HOST || '0.0.0.0';

// Support DB_URL alias by mapping to Prisma's expected DATABASE_URL
if (!process.env.DATABASE_URL && process.env.DB_URL) {
  process.env.DATABASE_URL = process.env.DB_URL;
}

app.use(cors());
app.use(express.json());

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// --- Validation helpers ---
function isInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

function validateQuestionPayload(body: any): { valid: boolean; message?: string } {
  const question = typeof body?.question === 'string' ? body.question.trim() : '';
  const answer = typeof body?.answer === 'string' ? body.answer.trim() : '';
  const points = body?.points;

  if (!question) return { valid: false, message: 'Question text is required.' };
  if (question.length > 500) return { valid: false, message: 'Question must be at most 500 characters.' };
  if (!answer) return { valid: false, message: 'Answer is required.' };
  if (answer.length > 200) return { valid: false, message: 'Answer must be at most 200 characters.' };
  if (!isInt(points)) return { valid: false, message: 'Points must be an integer.' };
  if (points < 0 || points > 100) return { valid: false, message: 'Points must be between 0 and 100.' };
  return { valid: true };
}

function validateStudentPayload(body: any): { valid: boolean; message?: string } {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const totalPoints = body?.totalPoints ?? 0;
  if (!name) return { valid: false, message: 'Student name is required.' };
  if (name.length > 100) return { valid: false, message: 'Student name must be at most 100 characters.' };
  if (!isInt(totalPoints)) return { valid: false, message: 'Total points must be an integer.' };
  if (totalPoints < 0) return { valid: false, message: 'Total points cannot be negative.' };
  return { valid: true };
}

// Questions
app.get('/api/questions', async (_req, res) => {
  const items = await prisma.question.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(items);
});

app.post('/api/questions', async (req, res) => {
  const v = validateQuestionPayload(req.body);
  if (!v.valid) return res.status(400).json({ error: v.message });
  const { question, answer, points } = req.body;
  try {
    const created = await prisma.question.create({ data: { question: question.trim(), answer: answer.trim(), points } });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create question.' });
  }
});

app.put('/api/questions/:id', async (req, res) => {
  const { id } = req.params;
  const v = validateQuestionPayload(req.body);
  if (!v.valid) return res.status(400).json({ error: v.message });
  const { question, answer, points } = req.body;
  try {
    const updated = await prisma.question.update({ where: { id }, data: { question: question.trim(), answer: answer.trim(), points } });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update question.' });
  }
});

app.delete('/api/questions/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.question.delete({ where: { id } });
  res.status(204).end();
});

// Students
app.get('/api/students', async (_req, res) => {
  const items = await prisma.student.findMany({ orderBy: { name: 'asc' } });
  res.json(items);
});

app.post('/api/students', async (req, res) => {
  const v = validateStudentPayload(req.body);
  if (!v.valid) return res.status(400).json({ error: v.message });
  const { name, totalPoints = 0 } = req.body;
  try {
    const created = await prisma.student.create({ data: { name: name.trim(), totalPoints } });
    res.status(201).json(created);
  } catch (err: any) {
    // Unique constraint violation
    if (err?.code === 'P2002') return res.status(409).json({ error: 'Student name must be unique.' });
    res.status(500).json({ error: 'Failed to create student.' });
  }
});

app.put('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  const v = validateStudentPayload(req.body);
  if (!v.valid) return res.status(400).json({ error: v.message });
  const { name, totalPoints } = req.body;
  try {
    const updated = await prisma.student.update({ where: { id }, data: { name: name.trim(), totalPoints } });
    res.json(updated);
  } catch (err: any) {
    if (err?.code === 'P2002') return res.status(409).json({ error: 'Student name must be unique.' });
    res.status(500).json({ error: 'Failed to update student.' });
  }
});

app.post('/api/students/:id/add-points', async (req, res) => {
  const { id } = req.params;
  const { points } = req.body as { points: number };
  if (!isInt(points) || points < 0 || points > 100) {
    return res.status(400).json({ error: 'Points must be an integer between 0 and 100.' });
  }
  try {
    const updated = await prisma.student.update({ where: { id }, data: { totalPoints: { increment: points } } });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to add points.' });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.student.delete({ where: { id } });
  res.status(204).end();
});

async function start() {
  // In development, use Vite's dev server as middleware to serve frontend
  if (process.env.NODE_ENV !== 'production') {
    const vite = await import('vite');
    const viteDevServer = await vite.createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // Use Vite's connect instance as middleware
    app.use(viteDevServer.middlewares);

    // Fallback to index.html for SPA routes
    app.use('*', async (req, res) => {
      try {
        const url = req.originalUrl;
        let html = await fs.readFile(path.resolve('index.html'), 'utf-8');
        html = await viteDevServer.transformIndexHtml(url, html);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch {
        res.status(500).end('Internal Server Error');
      }
    });
  } else {
    // In production, serve the built frontend from /dist
    const distPath = path.resolve('dist');
    const indexHtml = path.resolve(distPath, 'index.html');
    app.use(express.static(distPath));

    app.get('*', async (_req, res) => {
      try {
        const html = await fs.readFile(indexHtml, 'utf-8');
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch {
        res.status(500).end('Internal Server Error');
      }
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT} (env=${process.env.NODE_ENV || 'development'})`);
  });
}

start();