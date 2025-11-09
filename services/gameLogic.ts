
import { Question, GameBoard } from '../types';

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const initializeGameBoard = (questions: Question[], numDice: 1 | 2): GameBoard => {
  const gameBoard: GameBoard = new Map();

  if (questions.length === 0) {
    return gameBoard;
  }

  const shuffledQuestions = shuffleArray(questions);
  const minRoll = numDice === 1 ? 1 : 2;
  const maxRoll = numDice === 1 ? 6 : 12;
  const numSlots = maxRoll - minRoll + 1;

  for (let i = 0; i < numSlots; i++) {
    const rollResult = minRoll + i;
    const questionIndex = i % shuffledQuestions.length; // Reuse questions if not enough
    gameBoard.set(rollResult, shuffledQuestions[questionIndex]);
  }

  return gameBoard;
};
