
import React from 'react';
import { Student, AdminLanguage, SortConfig } from '../types';
import { TRANSLATIONS } from '../constants';
import { UserIcon, SortAscIcon, SortDescIcon } from './Icons';

interface StudentRosterProps {
  students: Student[];
  activeStudentId: string | null;
  onSelectStudent: (id: string) => void;
  language: AdminLanguage;
  sortConfig: SortConfig;
  onSortChange: (key: 'name' | 'score') => void;
}

const StudentRoster: React.FC<StudentRosterProps> = ({
  students,
  activeStudentId,
  onSelectStudent,
  language,
  sortConfig,
  onSortChange,
}) => {
  const t = TRANSLATIONS[language];

  const SortIcon = ({ sortKey }: { sortKey: 'name' | 'score' }) => {
    if (sortConfig.key !== sortKey) return null;
    return sortConfig.order === 'asc' ? <SortAscIcon /> : <SortDescIcon />;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-sky-700 mb-4">{t.studentRoster}</h2>
      
      <div className="grid grid-cols-2 gap-2 text-sm font-bold text-slate-600 mb-2 px-2">
        <button onClick={() => onSortChange('score')} className="flex items-center gap-1 hover:text-sky-700">
          {t.sortByScore}
          <SortIcon sortKey="score" />
        </button>
        <button onClick={() => onSortChange('name')} className="flex items-center gap-1 justify-end hover:text-sky-700">
          {t.sortByName}
          <SortIcon sortKey="name" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {students.length === 0 ? (
          <p className="text-slate-600 text-center mt-4">{t.noStudents}</p>
        ) : (
          students.map(student => (
            <button
              key={student.id}
              onClick={() => onSelectStudent(student.id)}
              className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${
                activeStudentId === student.id
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'bg-slate-100 hover:bg-slate-200'
              }`}
            >
              <span className={`font-bold text-lg ${activeStudentId === student.id ? 'text-white' : 'text-sky-700'}`}>
                {student.score}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{student.name}</span>
                <UserIcon className={`w-5 h-5 ${activeStudentId === student.id ? 'opacity-90' : 'opacity-50'}`} />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentRoster;
