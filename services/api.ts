// Simple API client for the ChemRoll backend
import { Question, Student } from '../types';

// Default to same-origin requests and rely on Vite proxy in dev.
// Optionally override with VITE_API_URL for direct backend calls.
const API_BASE = (import.meta as any)?.env?.VITE_API_URL ?? '';

type ApiQuestion = Question & { createdAt?: string };
type ApiStudent = { id: string; name: string; totalPoints: number };

const toQuestion = (q: ApiQuestion): Question => ({ id: q.id, question: q.question, answer: q.answer, points: q.points });
const toStudent = (s: ApiStudent): Student => ({ id: s.id, name: s.name, score: s.totalPoints });

async function safeError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return (data as any)?.error ?? res.statusText;
  } catch {
    try {
      const text = await res.text();
      return text || res.statusText;
    } catch {
      return res.statusText;
    }
  }
}

export const api = {
  async getQuestions(): Promise<Question[]> {
    const res = await fetch(`${API_BASE}/api/questions`);
    const data: ApiQuestion[] = await res.json();
    return data.map(toQuestion);
  },
  async createQuestion(payload: Omit<Question, 'id'>): Promise<Question> {
    const res = await fetch(`${API_BASE}/api/questions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await safeError(res);
      throw new Error(err);
    }
    const data: ApiQuestion = await res.json();
    return toQuestion(data);
  },
  async updateQuestion(id: string, payload: Omit<Question, 'id'>): Promise<Question> {
    const res = await fetch(`${API_BASE}/api/questions/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await safeError(res);
      throw new Error(err);
    }
    const data: ApiQuestion = await res.json();
    return toQuestion(data);
  },
  async deleteQuestion(id: string): Promise<void> {
    await fetch(`${API_BASE}/api/questions/${id}`, { method: 'DELETE' });
  },

  async getStudents(): Promise<Student[]> {
    const res = await fetch(`${API_BASE}/api/students`);
    const data: ApiStudent[] = await res.json();
    return data.map(toStudent);
  },
  async createStudent(payload: Omit<Student, 'id'>): Promise<Student> {
    const res = await fetch(`${API_BASE}/api/students`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: payload.name, totalPoints: payload.score ?? 0 })
    });
    if (!res.ok) {
      const err = await safeError(res);
      throw new Error(err);
    }
    const data: ApiStudent = await res.json();
    return toStudent(data);
  },
  async updateStudent(id: string, payload: Omit<Student, 'id'>): Promise<Student> {
    const res = await fetch(`${API_BASE}/api/students/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: payload.name, totalPoints: payload.score })
    });
    if (!res.ok) {
      const err = await safeError(res);
      throw new Error(err);
    }
    const data: ApiStudent = await res.json();
    return toStudent(data);
  },
  async deleteStudent(id: string): Promise<void> {
    await fetch(`${API_BASE}/api/students/${id}`, { method: 'DELETE' });
  },
  async addStudentPoints(id: string, points: number): Promise<Student> {
    const res = await fetch(`${API_BASE}/api/students/${id}/add-points`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ points })
    });
    if (!res.ok) {
      const err = await safeError(res);
      throw new Error(err);
    }
    const data: ApiStudent = await res.json();
    return toStudent(data);
  },
  async resetAllStudentScores(students: Student[]): Promise<void> {
    await Promise.all(students.map(s => fetch(`${API_BASE}/api/students/${s.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: s.name, totalPoints: 0 })
    })));
  }
};