
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameSettings, Question, GameBoard, AdminLanguage, Student, SortConfig } from './types';
import { api } from './services/api';
import { initializeGameBoard } from './services/gameLogic';
import GameView from './components/GameView';
import StudentRoster from './components/StudentRoster';
import AdminPanel from './components/AdminPanel';
import { SettingsIcon } from './components/Icons';

const App: React.FC = () => {
  const [gameSettings, setGameSettings] = useState<GameSettings>({ numDice: 2 });
  const [questionBank, setQuestionBank] = useState<Question[]>([]);
  const [adminLanguage, setAdminLanguage] = useState<AdminLanguage>('he');
  const [students, setStudents] = useState<Student[]>([]);
  const [studentSort, setStudentSort] = useState<SortConfig>({ key: 'name', order: 'asc' });

  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.dir = adminLanguage === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = adminLanguage;
  }, [adminLanguage]);

  useEffect(() => {
    if (!activeStudentId && students.length > 0) {
      setActiveStudentId(students[0].id);
    }
  }, [activeStudentId, students]);

  // Load data from API
  useEffect(() => {
    const load = async () => {
      const [qs, ss] = await Promise.all([api.getQuestions(), api.getStudents()]);
      setQuestionBank(qs);
      setStudents(ss);
    };
    load();
  }, []);

  const gameBoard: GameBoard = useMemo(() => {
    return initializeGameBoard(questionBank, gameSettings.numDice);
  }, [questionBank, gameSettings.numDice]);

  const handleUpdateScore = async (studentId: string, points: number) => {
    const updated = await api.addStudentPoints(studentId, points);
    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
  };
  
  const activeStudent = useMemo(() => students.find(s => s.id === activeStudentId) || null, [students, activeStudentId]);

  const sortedStudents = useMemo(() => {
    const sorted = [...students].sort((a, b) => {
      if (studentSort.key === 'name') {
        return a.name.localeCompare(b.name);
      }
      return b.score - a.score; // Score is always high to low first
    });
    if (studentSort.order === 'desc') {
      if (studentSort.key === 'score') return sorted.reverse(); // Low to high
      return sorted.reverse(); // Z-A
    }
    return sorted;
  }, [students, studentSort]);

  const handleSortChange = (key: 'name' | 'score') => {
    setStudentSort(prevSort => {
      if (prevSort.key === key) {
        return { key, order: prevSort.order === 'asc' ? 'desc' : 'asc' };
      }
      return { key, order: 'asc' };
    });
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col p-4 bg-gradient-to-br from-sky-50 to-white">
      <header className="flex justify-between items-center w-full max-w-7xl mx-auto mb-4">
          <h1 className="text-3xl font-bold text-sky-700">ChemRoll</h1>
          <button
              onClick={() => setIsAdminPanelOpen(true)}
              className="text-slate-600 hover:text-sky-700 transition-colors"
              aria-label="Open Settings"
          >
              <SettingsIcon className="w-8 h-8" />
          </button>
      </header>

      <main className="flex-1 flex flex-col md:flex-row gap-8 w-full max-w-7xl mx-auto rtl:md:flex-row-reverse">
        <div className="md:w-1/3 lg:w-1/4">
          <StudentRoster
            students={sortedStudents}
            activeStudentId={activeStudentId}
            onSelectStudent={setActiveStudentId}
            language={adminLanguage}
            sortConfig={studentSort}
            onSortChange={handleSortChange}
          />
        </div>
        <div className="flex-1">
          <GameView
            gameBoard={gameBoard}
            numDice={gameSettings.numDice}
            activeStudent={activeStudent}
            onUpdateScore={handleUpdateScore}
            isGameReady={questionBank.length > 0 && students.length > 0}
            language={adminLanguage}
          />
        </div>
      </main>

      {isAdminPanelOpen && (
        <AdminPanel
          onClose={() => setIsAdminPanelOpen(false)}
          gameSettings={gameSettings}
          setGameSettings={setGameSettings}
          questionBank={questionBank}
          setQuestionBank={setQuestionBank}
          students={students}
          setStudents={setStudents}
          language={adminLanguage}
          setLanguage={setAdminLanguage}
        />
      )}
    </div>
  );
};

export default App;
