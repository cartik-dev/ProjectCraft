import React from 'react';
import { GameViewport } from './components/GameViewport';
import { RecipeBookMobile } from './components/RecipeBookMobile';

export const App: React.FC = () => {
  const refreshInventory = () => {
    // Refresh the existing InventoryGUI without introducing a second mobile control.
    window.setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e', bubbles: true, cancelable: true }));
      window.setTimeout(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e', bubbles: true, cancelable: true }));
      }, 60);
    }, 0);
  };

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <GameViewport />
      <RecipeBookMobile onRefreshInventory={refreshInventory} />
    </main>
  );
};

export default App;
