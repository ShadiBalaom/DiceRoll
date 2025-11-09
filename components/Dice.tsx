import React from 'react';

// Enum representing valid die faces
export enum DieFace {
  One = 1,
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
}

// Map enum to orientation class names
const showClassForFace = (face: DieFace): string => {
  return `show-${face}`; // CSS classes defined in index.html
};

// Ensure we render a valid face (fallback to 1)
const normalizeFace = (value: number): DieFace => {
  if (value >= 1 && value <= 6) return value as DieFace;
  return DieFace.One;
};

// Renders the dots (pips) on a single face using a CSS Grid layout.
const DieFaceContent: React.FC<{ value: DieFace }> = ({ value }) => {
  const pips = Array.from({ length: value }, (_, i) => <div key={i} className="pip"></div>);
  return (
    <div className={`die-face-content face-${value}`}>
      {pips}
    </div>
  );
};

// The 3D cube component that handles animation and state.
const DieCube: React.FC<{ value: number; isRolling: boolean }> = ({ value, isRolling }) => {
  // The key prop in the parent component ensures this component re-mounts for each roll,
  // which guarantees the animation class is freshly applied.
  // The internal state for `isAnimating` is no longer needed.
  const face = normalizeFace(value);
  const cubeClassName = isRolling ? 'animate-roll-3d' : showClassForFace(face);

  return (
    <div className="die-container">
      <div className={`die-cube ${cubeClassName}`}>
        {/* Faces arranged to match standard dice layout (opposites sum to 7) */}
        <div className="die-face face-front"><DieFaceContent value={DieFace.One} /></div>
        <div className="die-face face-back"><DieFaceContent value={DieFace.Six} /></div>
        <div className="die-face face-right"><DieFaceContent value={DieFace.Five} /></div>
        <div className="die-face face-left"><DieFaceContent value={DieFace.Two} /></div>
        <div className="die-face face-top"><DieFaceContent value={DieFace.Three} /></div>
        <div className="die-face face-bottom"><DieFaceContent value={DieFace.Four} /></div>
      </div>
    </div>
  );
};


// Main exported component to match the existing API used in GameView.
const Dice: React.FC<{ value: number; isRolling?: boolean }> = ({ value, isRolling = false }) => {
  return <DieCube value={value} isRolling={isRolling} />;
};

export default Dice;