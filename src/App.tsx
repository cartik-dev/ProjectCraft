import React from 'react';
import { GameViewport } from './components/GameViewport';

export const App: React.FC = () => {
  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <GameViewport />
    </main>
  );
};

export default App;
