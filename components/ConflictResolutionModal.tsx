import React from 'react';
import { Question, Student, InterFileConflict } from '../types';
import { TRANSLATIONS } from '../constants';
import { AdminLanguage } from '../types';

export type Resolution = 'keep' | 'replace' | 'add_as_new';

interface ConflictResolutionModalProps {
  conflict: InterFileConflict | null;
  onResolve: (resolution: Resolution, item: Student | Question) => void;
  onCancel: () => void;
  language: AdminLanguage;
  itemType: 'student' | 'question';
}

const renderItem = (item: Student | Question) => {
  if ('name' in item) { // It's a Student
    return (
      <>
        <p><span className="font-semibold">ID:</span> {item.id}</p>
        <p><span className="font-semibold">Name:</span> {item.name}</p>
        <p><span className="font-semibold">Score:</span> {item.score}</p>
      </>
    );
  } else { // It's a Question
    return (
      <>
        <p><span className="font-semibold">ID:</span> {item.id}</p>
        <p><span className="font-semibold">Question:</span> {item.question}</p>
        <p><span className="font-semibold">Answer:</span> {item.answer}</p>
        <p><span className="font-semibold">Points:</span> {item.points}</p>
      </>
    );
  }
};


const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({ conflict, onResolve, onCancel, language, itemType }) => {
  const t = TRANSLATIONS[language];
  if (!conflict) return null;
  
  const title = itemType === 'student' ? 'Student ID Conflict' : 'Question ID Conflict';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col" dir={language === 'he' ? 'rtl' : 'ltr'}>
        <header className="p-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-sky-700">{title}</h2>
          <p className="text-slate-600">An item with ID <span className="font-mono bg-slate-100 px-1 rounded">{conflict.id}</span> already exists.</p>
        </header>

        <main className="p-6 grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2 border-b border-slate-200 pb-1">Existing Record</h3>
            <div className="space-y-2 text-slate-800 bg-slate-100 p-3 rounded">
              {renderItem(conflict.original)}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2 border-b border-slate-200 pb-1">Imported Record</h3>
            <div className="space-y-2 text-slate-800 bg-slate-100 p-3 rounded">
              {renderItem(conflict.imported)}
            </div>
          </div>
        </main>

        <footer className="p-4 bg-slate-100 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button onClick={() => onResolve('keep', conflict.imported)} className="px-4 py-2 w-full sm:w-auto bg-slate-200 hover:bg-slate-300 font-bold rounded-lg transition-colors">Keep Existing</button>
            <button onClick={() => onResolve('replace', conflict.imported)} className="px-4 py-2 w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors">Replace with Imported</button>
            <button onClick={() => onResolve('add_as_new', conflict.imported)} className="px-4 py-2 w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg transition-colors">Import with New ID</button>
        </footer>
        <button onClick={onCancel} className="w-full text-center py-2 text-slate-600 hover:text-slate-800 text-sm">Cancel Import</button>
      </div>
    </div>
  );
};

export default ConflictResolutionModal;