import React, { useState, useEffect, useMemo } from 'react';
import { Question, Student, IntraFileConflict, AdminLanguage } from '../types';
import { TRANSLATIONS } from '../constants';

interface IntraFileConflictModalProps {
  conflicts: IntraFileConflict[];
  onResolve: (resolvedItems: (Student | Question)[]) => void;
  onCancel: () => void;
  language: AdminLanguage;
  itemType: 'student' | 'question';
}

type EditedItemsState = {
  [originalId: string]: {
    [itemIndex: number]: {
      newItem: Student | Question;
      error?: string;
    };
  };
};

const renderItemSummary = (item: Student | Question) => {
  if ('name' in item) { // Student
    return `Name: ${item.name}`;
  } else { // Question
    return `Question: ${item.question.substring(0, 30)}...`;
  }
};

const IntraFileConflictModal: React.FC<IntraFileConflictModalProps> = ({
  conflicts,
  onResolve,
  onCancel,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [editedItems, setEditedItems] = useState<EditedItemsState>({});

  useEffect(() => {
    const initialState: EditedItemsState = {};
    conflicts.forEach(conflict => {
      initialState[conflict.id] = {};
      conflict.items.forEach((item, index) => {
        initialState[conflict.id][index] = { newItem: { ...item } };
      });
    });
    setEditedItems(initialState);
  }, [conflicts]);

  const allIds = useMemo(() => {
    const ids: string[] = [];
    Object.values(editedItems).forEach(conflictGroup => {
      Object.values(conflictGroup).forEach(({ newItem }) => {
        ids.push(newItem.id);
      });
    });
    return ids;
  }, [editedItems]);

  const handleIdChange = (originalId: string, itemIndex: number, newId: string) => {
    setEditedItems(prev => {
      const newState = JSON.parse(JSON.stringify(prev)); // Deep copy
      newState[originalId][itemIndex].newItem.id = newId;
      return newState;
    });
  };

  const isValid = useMemo(() => {
    const idCounts: { [id: string]: number } = {};
    allIds.forEach(id => {
      idCounts[id] = (idCounts[id] || 0) + 1;
    });
    
    for (const count of Object.values(idCounts)) {
        if (count > 1) {
            return false;
        }
    }

    return allIds.every(id => id.trim() !== '');
  }, [allIds]);
  
  const handleResolve = () => {
    if (!isValid) return;

    const resolvedList: (Student | Question)[] = [];
    Object.values(editedItems).forEach(conflictGroup => {
      Object.values(conflictGroup).forEach(({ newItem }) => {
        resolvedList.push(newItem);
      });
    });
    onResolve(resolvedList);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]" dir={language === 'he' ? 'rtl' : 'ltr'}>
        <header className="p-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-sky-700">{t.intraFileConflictTitle}</h2>
          <p className="text-slate-600 mt-1">{t.intraFileConflictDescription}</p>
        </header>

        <main className="p-6 overflow-y-auto space-y-6">
          {conflicts.map(conflict => (
            <div key={conflict.id} className="bg-slate-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-700 mb-3 border-b border-slate-200 pb-2">
                {t.conflictingId}: <span className="font-mono bg-slate-100 px-2 py-1 rounded text-amber-700">{conflict.id}</span>
              </h3>
              <div className="space-y-3">
                {conflict.items.map((item, index) => {
                  const currentId = editedItems[conflict.id]?.[index]?.newItem.id || '';
                  const isDuplicate = allIds.filter(id => id === currentId).length > 1;

                  return (
                    <div key={index} className="flex items-center gap-4">
                      <div className="flex-1 bg-slate-50 p-2 rounded">
                        <p className="text-sm text-slate-800">{renderItemSummary(item)}</p>
                      </div>
                      <div className="w-1/3">
                         <input
                          type="text"
                          value={currentId}
                          onChange={(e) => handleIdChange(conflict.id, index, e.target.value)}
                          className={`w-full bg-white border rounded p-2 text-slate-800 font-mono ${isDuplicate ? 'border-red-500' : 'border-slate-300'}`}
                        />
                        {isDuplicate && <p className="text-red-500 text-xs mt-1">This ID is duplicated.</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </main>
        
        <footer className="p-4 bg-slate-100 flex flex-col sm:flex-row justify-end items-center gap-4">
          <button onClick={onCancel} className="px-4 py-2 w-full sm:w-auto bg-slate-200 hover:bg-slate-300 font-bold rounded-lg transition-colors">{t.cancelImport}</button>
          <button onClick={handleResolve} disabled={!isValid} className="px-4 py-2 w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed">
            {t.resolveAndContinue}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default IntraFileConflictModal;
