import React, { useState, useEffect } from 'react';
import { GameBoard, Student, Question, AdminLanguage } from '../types';
import { TRANSLATIONS } from '../constants';
import Dice from './Dice';
import { AtomIcon, BeakerIcon } from './Icons';

interface GameViewProps {
  gameBoard: GameBoard;
  numDice: 1 | 2;
  activeStudent: Student | null;
  onUpdateScore: (studentId: string, points: number) => void;
  isGameReady: boolean;
  language: AdminLanguage;
}

// Group all states related to a single turn into one object for atomic updates
interface TurnState {
  dice: [number, number];
  isRolling: boolean;
  shuffling: boolean;
  flippedCard: number | null;
  rollTotal: number | null;
}

const GameView: React.FC<GameViewProps> = ({
  gameBoard,
  numDice,
  activeStudent,
  onUpdateScore,
  isGameReady,
  language,
}) => {
  const t = TRANSLATIONS[language];
  
  const initialTurnState: TurnState = {
    dice: numDice,
    isRolling: false,
    shuffling: false,
    flippedCard: null,
    rollTotal: null,
  };

  const [turnState, setTurnState] = useState<TurnState>(initialTurnState);
  const [answerResult, setAnswerResult] = useState<'correct' | 'incorrect' | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [rollCount, setRollCount] = useState(0);

  const cardNumbers = Array.from(gameBoard.keys());

  useEffect(() => {
    // When the active student or number of dice changes, reset the board state completely
    setTurnState(initialTurnState);
    setAnswerResult(null);
    setUserAnswer('');
  }, [activeStudent, numDice]);


  const handleRoll = () => {
    if (!activeStudent || turnState.isRolling || turnState.shuffling) return;
    
    setAnswerResult(null);
    setCorrectAnswer(null);

    const diceMode = numDice;
    const roll1 = Math.floor(Math.random() * 6) + 1;
    const roll2 = diceMode === 2 ? Math.floor(Math.random() * 6) + 1 : 0;
    const result = diceMode === 2 ? roll1 + roll2 : roll1;

    // State for the "rolling" phase
    const rollingState: TurnState = {
      dice: [roll1, roll2],
      isRolling: true,
      shuffling: false,
      flippedCard: null,
      rollTotal: result,
    };
    setTurnState(rollingState);
    setRollCount(count => count + 1);

    setTimeout(() => {
      // State for the "shuffling" phase
      const shufflingState: TurnState = {
        dice: [roll1, roll2],
        isRolling: false,
        shuffling: true,
        flippedCard: null,
        rollTotal: result,
      };
      setTurnState(shufflingState);

      setTimeout(() => {
        // State for the "card flipped" phase
        const flippedState: TurnState = {
          dice: [roll1, roll2],
          isRolling: false,
          shuffling: false,
          flippedCard: result,
          rollTotal: result,
        };
        
        // Final check before setting state to ensure data integrity
        const finalValue = diceMode === 2 
          ? flippedState.dice[0] + flippedState.dice[1]
          : flippedState.dice[0];
        if (finalValue !== flippedState.flippedCard) {
          return;
        }
        if (!gameBoard.has(flippedState.flippedCard)) {
          return;
        }

        setTurnState(flippedState);
      }, 500); // Shuffle animation duration

    }, 1000); // Roll animation duration
  };

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnState.flippedCard || !activeStudent) return;
    
    const question = gameBoard.get(turnState.flippedCard);
    if (!question) return;

    const isCorrect = userAnswer.trim().toLowerCase() === question.answer.trim().toLowerCase();

    if (isCorrect) {
      onUpdateScore(activeStudent.id, question.points);
      setAnswerResult('correct');
    } else {
      setAnswerResult('incorrect');
      setCorrectAnswer(question.answer);
    }
    
    setUserAnswer('');
    
    setTimeout(() => {
        setTurnState(prev => ({ ...prev, flippedCard: null }));
    }, 3000);
  };

  const renderWelcomeOrMessage = () => {
    if (!isGameReady) {
      return (
        <div className="text-center text-slate-600">
            <BeakerIcon className="w-16 h-16 mx-auto mb-4" />
            <p className="text-xl">{t.noQuestions}</p>
        </div>
      );
    }
    if (!activeStudent) {
      return (
        <div className="text-center text-slate-600">
            <AtomIcon className="w-16 h-16 mx-auto mb-4" />
            <p className="text-xl">{t.selectStudent}</p>
        </div>
      );
    }
    return null;
  };
  
  const welcomeOrMessage = renderWelcomeOrMessage();

  return (
    <div className="bg-white rounded-lg shadow-lg h-full flex flex-col text-slate-800">
      {welcomeOrMessage ? (
        <div className="flex-1 flex items-center justify-center">{welcomeOrMessage}</div>
      ) : (
        <>
            <main className="flex-1 p-3 sm:p-4 md:p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 place-items-center">
                 {cardNumbers.map(num => {
                    const question = gameBoard.get(num)!;
                    const isFlipped = turnState.flippedCard === num;
                    const isShuffling = turnState.shuffling && turnState.flippedCard !== num;
                    return (
                        <div key={num} className={`card-container w-full h-full aspect-square max-w-[120px] sm:max-w-[150px] ${isFlipped ? 'flipped z-10' : ''}`}>
                            <div className="card-inner">
                                {/* Card Front */}
                                <div className={`card-front bg-white border border-slate-300 rounded-lg flex flex-col items-center justify-center shadow-lg transition-transform duration-300 ${isShuffling ? 'animate-card-shuffle' : ''} ${isFlipped ? 'scale-110' : ''}`}>
                                    <span className="text-4xl font-bold text-sky-700">{num}</span>
                                    {Number(num) % 2 === 0 ? <AtomIcon className="w-8 h-8 text-sky-500 mt-2" /> : <BeakerIcon className="w-8 h-8 text-sky-500 mt-2" />}
                                </div>
                                {/* Card Back */}
                                <div className="card-back bg-sky-50 border border-sky-200 rounded-lg p-3 flex flex-col shadow-lg">
                                    <p className="text-sm font-semibold flex-1 overflow-y-auto">{question.question}</p>
                                    <form onSubmit={handleSubmitAnswer} className="mt-2">
                                        <input
                                            type="text"
                                            value={userAnswer}
                                            onChange={(e) => setUserAnswer(e.target.value)}
                                            placeholder={t.yourAnswer}
                                            className="w-full bg-white border border-slate-300 rounded p-2 text-sm text-slate-800"
                                            autoFocus
                                        />
                                        <button type="submit" className="w-full mt-2 px-2 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded">
                                            {t.submitAnswer}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    );
                 })}
            </main>
            <footer className="bg-slate-100 p-3 sm:p-4 rounded-b-lg flex flex-col items-center justify-center text-center h-32 sm:h-40">
                {!answerResult ? (
                    <>
                        <h2 className="text-xl font-bold mb-2 text-sky-700">{activeStudent?.name}</h2>
                        <div className="flex items-center gap-6">
                            <Dice key={`d1-${rollCount}`} value={turnState.dice[0]} isRolling={turnState.isRolling} />
                            {numDice === 2 && <Dice key={`d2-${rollCount}`} value={turnState.dice[1]} isRolling={turnState.isRolling} />}
                            <button
                                onClick={handleRoll}
                                disabled={turnState.isRolling || turnState.shuffling || !activeStudent || turnState.flippedCard !== null}
                                className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-lg rounded-lg shadow-lg transition-transform hover:scale-105 disabled:bg-slate-300 disabled:cursor-not-allowed"
                            >
                                {turnState.isRolling ? '...' : (numDice === 1 ? t.rollDiceSingular : t.rollDicePlural)}
                            </button>
                        </div>
                        {/* Debugging text removed */}
                    </>
                ) : (
                    <div className="text-center p-4 rounded-lg w-full max-w-md">
                        {answerResult === 'correct' && (
                            <p className="text-2xl font-bold text-green-600">{t.correct}</p>
                        )}
                        {answerResult === 'incorrect' && (
                            <div>
                                <p className="text-2xl font-bold text-rose-600">{t.incorrect}</p>
                                <p className="text-slate-600 mt-2">{correctAnswer}</p>
                            </div>
                        )}
                    </div>
                )}
            </footer>
        </>
      )}
    </div>
  );
};

export default GameView;