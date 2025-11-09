import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || '0.0.0.0';

// Support DB_URL alias by mapping to Prisma's expected DATABASE_URL
if (!process.env.DATABASE_URL && process.env.DB_URL) {
  process.env.DATABASE_URL = process.env.DB_URL;
}

app.use(cors());
app.use(express.json());

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Questions
app.get('/api/questions', async (_req, res) => {
  const items = await prisma.question.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(items);
});

app.post('/api/questions', async (req, res) => {
  const { question, answer, points } = req.body;
  const created = await prisma.question.create({ data: { question, answer, points } });
  res.status(201).json(created);
});

app.put('/api/questions/:id', async (req, res) => {
  const { id } = req.params;
  const { question, answer, points } = req.body;
  const updated = await prisma.question.update({ where: { id }, data: { question, answer, points } });
  res.json(updated);
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
  const { name, totalPoints = 0 } = req.body;
  const created = await prisma.student.create({ data: { name, totalPoints } });
  res.status(201).json(created);
});

app.put('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  const { name, totalPoints } = req.body;
  const updated = await prisma.student.update({ where: { id }, data: { name, totalPoints } });
  res.json(updated);
});

app.post('/api/students/:id/add-points', async (req, res) => {
  const { id } = req.params;
  const { points } = req.body as { points: number };
  const updated = await prisma.student.update({ where: { id }, data: { totalPoints: { increment: points } } });
  res.json(updated);
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
  }

  app.listen(PORT, HOST, () => {
    // Single-port dev server (API + frontend)
  });
}

start();