import React from 'react';
import { GameViewport } from './components/GameViewport';
import { RecipeBookMobile } from './components/RecipeBookMobile';

export const App: React.FC = () => (
  <main style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
    <GameViewport />
    <RecipeBookMobile />
  </main>
);

export default App;
