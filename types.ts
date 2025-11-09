import React from 'react';

export interface Question {
  id: string;
  question: string;
  answer: string;
  points: number;
}

export interface Student {
  id: string;
  name: string;
  score: number;
}

export interface GameSettings {
  numDice: 1 | 2;
}

export type GameBoard = Map<number, Question>;

export type AdminLanguage = 'en' | 'he';

export type SortConfig = {
  key: 'name' | 'score';
  order: 'asc' | 'desc';
};

// Represents a conflict between an existing item and an imported one
export type InterFileConflict = {
  id: string;
  original: Student | Question;
  imported: Student | Question;
};

// Represents a conflict where multiple items within the same import file share an ID
export type IntraFileConflict = {
  id: string;
  items: (Student | Question)[];
};
