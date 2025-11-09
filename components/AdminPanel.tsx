import React, { useState, useRef, ChangeEvent } from 'react';
import { GameSettings, Question, Student, AdminLanguage, InterFileConflict, IntraFileConflict } from '../types';
import { TRANSLATIONS } from '../constants';
import { CloseIcon, EditIcon, DeleteIcon } from './Icons';
import { generateNewId } from '../services/idUtils';
import { api } from '../services/api';
import ConflictResolutionModal, { Resolution } from './ConflictResolutionModal';
import IntraFileConflictModal from './IntraFileConflictModal';

const INITIAL_QUESTION_STATE: Omit<Question, 'id'> = { question: '', answer: '', points: 10 };
const INITIAL_STUDENT_STATE: Omit<Student, 'id' | 'score'> = { name: '' };

type EditableItem = (Question | Student) & { isNew?: boolean };

interface AdminPanelProps {
  onClose: () => void;
  gameSettings: GameSettings;
  setGameSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
  questionBank: Question[];
  setQuestionBank: React.Dispatch<React.SetStateAction<Question[]>>;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  language: AdminLanguage;
  setLanguage: React.Dispatch<React.SetStateAction<AdminLanguage>>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  onClose,
  gameSettings,
  setGameSettings,
  questionBank,
  setQuestionBank,
  students,
  setStudents,
  language,
  setLanguage,
}) => {
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'settings' | 'questions' | 'students'>('settings');
  const [editingItem, setEditingItem] = useState<EditableItem | null>(null);

  const [newQuestion, setNewQuestion] = useState(INITIAL_QUESTION_STATE);
  const [newStudent, setNewStudent] = useState(INITIAL_STUDENT_STATE);

  const questionImportRef = useRef<HTMLInputElement>(null);
  const studentImportRef = useRef<HTMLInputElement>(null);

  const [interFileConflicts, setInterFileConflicts] = useState<InterFileConflict[]>([]);
  const [intraFileConflicts, setIntraFileConflicts] = useState<IntraFileConflict[]>([]);
  const [itemsToImport, setItemsToImport] = useState<(Student | Question)[]>([]);
  const [importItemType, setImportItemType] = useState<'student' | 'question' | null>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set<string>());
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set<string>());

  // --- Question Management ---
  const handleQuestionChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isPoints = name === 'points';
    if (editingItem && 'question' in editingItem) {
      setEditingItem({ ...editingItem, [name]: isPoints ? parseInt(value) || 0 : value });
    } else {
      setNewQuestion({ ...newQuestion, [name]: isPoints ? parseInt(value) || 0 : value });
    }
  };

  const handleSaveQuestion = async () => {
    if (editingItem && 'question' in editingItem) {
      const updated = await api.updateQuestion(editingItem.id, { question: editingItem.question, answer: editingItem.answer, points: editingItem.points });
      setQuestionBank(prev => prev.map(q => q.id === updated.id ? updated : q));
    } else {
      const created = await api.createQuestion(newQuestion);
      setQuestionBank(prev => [...prev, created]);
      setNewQuestion(INITIAL_QUESTION_STATE);
    }
    setEditingItem(null);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (window.confirm(t.deleteQuestionConfirmation)) {
      if (editingItem && 'question' in editingItem && editingItem.id === id) {
        setEditingItem(null);
      }
      await api.deleteQuestion(id);
      setQuestionBank(prev => prev.filter(q => q.id !== id));
      setSelectedQuestionIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const toggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearSelectedQuestions = async () => {
    if (selectedQuestionIds.size === 0) return;
    if (!window.confirm('Delete selected questions?')) return;
    const ids = Array.from(selectedQuestionIds);
    await Promise.all(ids.map(id => api.deleteQuestion(id)));
    setQuestionBank(prev => prev.filter(q => !selectedQuestionIds.has(q.id)));
    setSelectedQuestionIds(new Set<string>());
  };

  const clearAllQuestions = async () => {
    if (!window.confirm('Delete ALL questions? This cannot be undone.')) return;
    await Promise.all(questionBank.map(q => api.deleteQuestion(q.id)));
    setQuestionBank([]);
    setSelectedQuestionIds(new Set<string>());
  };

  // --- Student Management ---
   const handleStudentChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editingItem && 'name' in editingItem) {
      setEditingItem({ ...editingItem, [name]: value });
    } else {
      setNewStudent({ ...newStudent, [name]: value });
    }
  };

  const handleSaveStudent = async () => {
    if (editingItem && 'name' in editingItem) {
      const updated = await api.updateStudent(editingItem.id, { name: editingItem.name, score: (editingItem as Student).score ?? 0 });
      setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
    } else {
      const created = await api.createStudent({ name: newStudent.name, score: 0 });
      setStudents(prev => [...prev, created]);
      setNewStudent(INITIAL_STUDENT_STATE);
    }
    setEditingItem(null);
  };

  const handleDeleteStudent = async (id: string) => {
    if (window.confirm(t.deleteStudentConfirmation)) {
      if (editingItem && 'name' in editingItem && editingItem.id === id) {
        setEditingItem(null);
      }
      await api.deleteStudent(id);
      setStudents(prev => prev.filter(s => s.id !== id));
      setSelectedStudentIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearSelectedStudents = async () => {
    if (selectedStudentIds.size === 0) return;
    if (!window.confirm('Delete selected students?')) return;
    const ids = Array.from(selectedStudentIds);
    await Promise.all(ids.map(id => api.deleteStudent(id)));
    setStudents(prev => prev.filter(s => !selectedStudentIds.has(s.id)));
    setSelectedStudentIds(new Set<string>());
  };

  const clearAllStudents = async () => {
    if (!window.confirm('Delete ALL students? This cannot be undone.')) return;
    await Promise.all(students.map(s => api.deleteStudent(s.id)));
    setStudents([]);
    setSelectedStudentIds(new Set<string>());
  };

  const handleResetScores = async () => {
    if (window.confirm(t.resetAllScoresConfirmation)) {
      await api.resetAllStudentScores(students);
      setStudents(prev => prev.map(s => ({ ...s, score: 0 })));
    }
  };

  // --- Import / Export Logic ---
  const handleExport = (data: any[], filename: string) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = filename;
    link.click();
  };

  const handleFileImport = (event: ChangeEvent<HTMLInputElement>, itemType: 'student' | 'question') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error('File content is not text');
        const parsedJson = JSON.parse(text);

        if (!Array.isArray(parsedJson)) {
          throw new Error('Imported file is not a valid JSON array.');
        }
        
        // FIX: The result of JSON.parse is `unknown`. After verifying it's an array,
        // a type assertion is needed to treat it as an array of our specific types.
        const importedItems = parsedJson as (Student | Question)[];
        
        // 1. Check for intra-file conflicts (duplicates in the import file itself)
        const idMap = new Map<string, (Student | Question)[]>();
        importedItems.forEach(item => {
          if (!idMap.has(item.id)) idMap.set(item.id, []);
          idMap.get(item.id)!.push(item);
        });

        const currentIntraConflicts: IntraFileConflict[] = [];
        idMap.forEach((items, id) => {
            if (items.length > 1) {
                currentIntraConflicts.push({ id, items });
            }
        });
        
        if (currentIntraConflicts.length > 0) {
          setIntraFileConflicts(currentIntraConflicts);
          setItemsToImport(importedItems); // Store the full original list
          setImportItemType(itemType);
          return; // Stop and wait for resolution
        }
        
        // If no intra-conflicts, proceed to inter-conflict check
        processInterFileConflicts(importedItems, itemType);

      } catch (error) {
        alert(`Error importing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };
  
  const processInterFileConflicts = async (items: (Student|Question)[], itemType: 'student' | 'question') => {
    const existingItems = itemType === 'student' ? students : questionBank;
    const existingIdMap = new Map<string, Student | Question>(
      (existingItems as (Student | Question)[]).map(item => [item.id, item])
    );
    const conflicts: InterFileConflict[] = [];
    const nonConflictingItems: (Student|Question)[] = [];

    items.forEach(importedItem => {
        const original = existingIdMap.get(importedItem.id);
        if (original) {
            conflicts.push({ id: importedItem.id, original, imported: importedItem });
        } else {
            nonConflictingItems.push(importedItem);
        }
    });

    if (conflicts.length > 0) {
        setInterFileConflicts(conflicts);
        setItemsToImport(nonConflictingItems); // Store non-conflicting items to be added later
        setImportItemType(itemType);
    } else {
        if (itemType === 'student') {
            const created = await Promise.all((nonConflictingItems as Student[]).map(s => api.createStudent({ name: s.name, score: s.score ?? 0 })));
            setStudents(prev => [...prev, ...created]);
        } else {
            const created = await Promise.all((nonConflictingItems as Question[]).map(q => api.createQuestion({ question: q.question, answer: q.answer, points: q.points })));
            setQuestionBank(prev => [...prev, ...created]);
        }
        alert('Import successful!');
    }
  };
  
  const handleInterFileResolve = async (resolution: Resolution, item: Student | Question) => {
    let updatedItems = [...itemsToImport];
    if (resolution === 'replace') {
        if (importItemType === 'student') {
            setStudents(prev => prev.map(s => s.id === item.id ? item as Student : s));
        } else {
            setQuestionBank(prev => prev.map(q => q.id === item.id ? item as Question : q));
        }
    } else if (resolution === 'add_as_new') {
        const newId = generateNewId(importItemType === 'student' ? 'ST' : 'QS', importItemType === 'student' ? students : questionBank);
        updatedItems.push({ ...item, id: newId });
    }
    
    setItemsToImport(updatedItems);
    
    const remainingConflicts = interFileConflicts.slice(1);
    setInterFileConflicts(remainingConflicts);
    
    if (remainingConflicts.length === 0) {
        if (importItemType === 'student') {
            const created = await Promise.all((updatedItems as Student[]).map(s => api.createStudent({ name: s.name, score: s.score ?? 0 })));
            setStudents(prev => [...prev, ...created]);
        } else {
            const created = await Promise.all((updatedItems as Question[]).map(q => api.createQuestion({ question: q.question, answer: q.answer, points: q.points })));
            setQuestionBank(prev => [...prev, ...created]);
        }
        setItemsToImport([]);
        setImportItemType(null);
        alert('Import finished!');
    }
  };
  
  const handleIntraFileResolve = (resolvedItems: (Student | Question)[]) => {
    // Get a set of the original IDs that were in conflict
    const conflictingIds = new Set(intraFileConflicts.map(c => c.id));

    // Filter the original full import list to get only the non-conflicting items
    const nonConflictingItems = itemsToImport.filter(item => !conflictingIds.has(item.id));

    // Combine the non-conflicting items with the newly resolved items
    const fullResolvedList = [...nonConflictingItems, ...resolvedItems];

    // Reset intra-file conflict state and original items
    setIntraFileConflicts([]);
    setItemsToImport([]);

    // Proceed to the next step with the full, corrected list
    processInterFileConflicts(fullResolvedList, importItemType!);
  };

  const cancelImport = () => {
    setInterFileConflicts([]);
    setIntraFileConflicts([]);
    setItemsToImport([]);
    setImportItemType(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'settings':
        return (
          <div>
            <h3 className="text-lg font-bold text-sky-700 mb-4">{t.gameSettings}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-700 mb-2">{t.numDice}</label>
                <div className="flex gap-4">
                  <button onClick={() => setGameSettings({ ...gameSettings, numDice: 1 })} className={`px-4 py-2 rounded ${gameSettings.numDice === 1 ? 'bg-sky-600 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}>
                    {t.oneDie}
                  </button>
                  <button onClick={() => setGameSettings({ ...gameSettings, numDice: 2 })} className={`px-4 py-2 rounded ${gameSettings.numDice === 2 ? 'bg-sky-600 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}>
                    {t.twoDice}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="language-select" className="block text-slate-700 mb-2">{t.language}</label>
                <select id="language-select" value={language} onChange={(e) => setLanguage(e.target.value as AdminLanguage)} className="bg-white border border-slate-300 rounded p-2 text-slate-800">
                    <option value="en">English</option>
                    <option value="he">עברית</option>
                </select>
              </div>
            </div>
            <div className="mt-12">
              <h3 className="text-lg font-bold text-red-500 mb-4">{t.dangerZone}</h3>
              <button onClick={handleResetScores} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg">{t.resetAllScores}</button>
            </div>
          </div>
        );
      case 'questions':
        const editedQuestion = (editingItem && 'question' in editingItem) ? editingItem : null;
        return (
           <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-sky-700">{t.questionBank}</h3>
                <div className="flex gap-2">
                  <input type="file" ref={questionImportRef} onChange={(e) => handleFileImport(e, 'question')} accept=".json" className="hidden" />
                  <button onClick={() => questionImportRef.current?.click()} className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-sm rounded-md">{t.importQuestions}</button>
                  <button onClick={() => handleExport(questionBank, 'chemroll-questions.json')} className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-sm rounded-md">{t.exportQuestions}</button>
                  <button onClick={clearSelectedQuestions} disabled={selectedQuestionIds.size===0} className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 text-sm rounded-md disabled:opacity-50">Clear Selected</button>
                  <button onClick={clearAllQuestions} className="px-3 py-1 bg-rose-200 hover:bg-rose-300 text-rose-800 text-sm rounded-md">Clear All</button>
                </div>
              </div>

              {/* Add/Edit Form */}
              <div className="bg-white border border-slate-200 p-4 rounded-lg mb-4">
                <h4 className="font-bold mb-2">{editedQuestion ? t.edit : t.addQuestion}</h4>
                <div className="space-y-2">
                  <textarea name="question" value={editedQuestion?.question ?? newQuestion.question} onChange={handleQuestionChange} placeholder={t.questionLabel} className="w-full bg-white border border-slate-300 rounded p-2 text-slate-800" rows={2}/>
                  <input type="text" name="answer" value={editedQuestion?.answer ?? newQuestion.answer} onChange={handleQuestionChange} placeholder={t.answerLabel} className="w-full bg-white border border-slate-300 rounded p-2 text-slate-800" />
                  <input type="number" name="points" value={editedQuestion?.points ?? newQuestion.points} onChange={handleQuestionChange} placeholder={t.pointsLabel} className="w-full bg-white border border-slate-300 rounded p-2 text-slate-800" />
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={handleSaveQuestion} className="px-4 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-md">{t.save}</button>
                  {editedQuestion && <button onClick={() => setEditingItem(null)} className="px-4 py-1 bg-slate-200 hover:bg-slate-300 rounded-md">{t.cancel}</button>}
                </div>
              </div>
              
              {/* Question List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {questionBank.length > 0 ? questionBank.map(q => (
                  <div key={q.id} className="bg-slate-100 p-3 rounded-lg flex justify-between items-start">
                    <div className="flex items-start gap-3 text-sm">
                        <input type="checkbox" checked={selectedQuestionIds.has(q.id)} onChange={() => toggleSelectQuestion(q.id)} />
                        <p className="font-bold">{q.question}</p>
                        <p className="text-slate-600">A: {q.answer} ({q.points} pts)</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => setEditingItem(q)} className="text-slate-500 hover:text-yellow-600"><EditIcon /></button>
                      <button onClick={() => handleDeleteQuestion(q.id)} className="text-slate-500 hover:text-rose-600"><DeleteIcon /></button>
                    </div>
                  </div>
                )) : <p className="text-slate-600 text-center">{t.noQuestions}</p>}
              </div>
          </div>
        );
      case 'students':
        const editedStudent = (editingItem && 'name' in editingItem) ? editingItem : null;
        return (
           <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-sky-700">{t.manageStudents}</h3>
                <div className="flex gap-2">
                  <input type="file" ref={studentImportRef} onChange={(e) => handleFileImport(e, 'student')} accept=".json" className="hidden" />
                  <button onClick={() => studentImportRef.current?.click()} className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-sm rounded-md">{t.importStudents}</button>
                  <button onClick={() => handleExport(students, 'chemroll-students.json')} className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-sm rounded-md">{t.exportStudents}</button>
                  <button onClick={clearSelectedStudents} disabled={selectedStudentIds.size===0} className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 text-sm rounded-md disabled:opacity-50">Clear Selected</button>
                  <button onClick={clearAllStudents} className="px-3 py-1 bg-rose-200 hover:bg-rose-300 text-rose-800 text-sm rounded-md">Clear All</button>
                </div>
              </div>

              {/* Add/Edit Form */}
               <div className="bg-white border border-slate-200 p-4 rounded-lg mb-4">
                <h4 className="font-bold mb-2">{editedStudent ? t.edit : t.addStudent}</h4>
                <div className="space-y-2">
                  <input type="text" name="name" value={editedStudent?.name ?? newStudent.name} onChange={handleStudentChange} placeholder={t.studentName} className="w-full bg-white border border-slate-300 rounded p-2 text-slate-800" />
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={handleSaveStudent} className="px-4 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-md">{t.save}</button>
                  {editedStudent && <button onClick={() => setEditingItem(null)} className="px-4 py-1 bg-slate-200 hover:bg-slate-300 rounded-md">{t.cancel}</button>}
                </div>
              </div>

              {/* Student List */}
               <div className="space-y-2 max-h-96 overflow-y-auto">
                {students.map(s => (
                  <div key={s.id} className="bg-slate-100 p-3 rounded-lg flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <input type="checkbox" checked={selectedStudentIds.has(s.id)} onChange={() => toggleSelectStudent(s.id)} />
                        <div>
                          <p className="font-bold">{s.name}</p>
                          <p className="text-slate-600 text-sm">Score: {s.score}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingItem(s)} className="text-slate-500 hover:text-yellow-600"><EditIcon /></button>
                      <button onClick={() => handleDeleteStudent(s.id)} className="text-slate-500 hover:text-rose-600"><DeleteIcon /></button>
                    </div>
                  </div>
                ))}
              </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" dir={language === 'he' ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        <header className="p-4 flex justify-between items-center border-b border-slate-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-sky-700">{t.adminPanelTitle}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <CloseIcon className="w-8 h-8" />
          </button>
        </header>
        <div className="flex flex-1 overflow-hidden">
            <nav className="w-1/4 border-r border-slate-200 p-4 flex-shrink-0">
                <ul className="space-y-2">
                    <li><button onClick={() => setActiveTab('settings')} className={`w-full text-left p-2 rounded ${activeTab === 'settings' ? 'bg-sky-100 text-sky-700' : 'hover:bg-slate-100'}`}>{t.gameSettings}</button></li>
                    <li><button onClick={() => setActiveTab('questions')} className={`w-full text-left p-2 rounded ${activeTab === 'questions' ? 'bg-sky-100 text-sky-700' : 'hover:bg-slate-100'}`}>{t.questionBank}</button></li>
                    <li><button onClick={() => setActiveTab('students')} className={`w-full text-left p-2 rounded ${activeTab === 'students' ? 'bg-sky-100 text-sky-700' : 'hover:bg-slate-100'}`}>{t.manageStudents}</button></li>
                </ul>
            </nav>
            <main className="flex-1 p-6 overflow-y-auto">
                {renderTabContent()}
            </main>
        </div>
      </div>
      {interFileConflicts.length > 0 && importItemType && (
          <ConflictResolutionModal
            conflict={interFileConflicts[0]}
            onResolve={handleInterFileResolve}
            onCancel={cancelImport}
            language={language}
            itemType={importItemType}
          />
      )}
      {intraFileConflicts.length > 0 && importItemType && (
        <IntraFileConflictModal
          conflicts={intraFileConflicts}
          onResolve={handleIntraFileResolve}
          onCancel={cancelImport}
          language={language}
          itemType={importItemType}
        />
      )}
    </div>
  );
};

export default AdminPanel;