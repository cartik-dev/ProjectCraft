import React, { useState } from 'react';
import { Smartphone, Monitor } from 'lucide-react';

interface MainMenuProps {
  onStartGame: () => void;
  isMobileMode: boolean;
  onToggleMobileMode: () => void;
  seed: number;
  onRegenerateWorld: (newSeed: number) => void;
  onOpenSettings?: () => void;
}

// --- Редкий явный матершинный пул (Шанс выпадения всего ~3.5%) ---
const RARE_EXPLICIT_SPLASHES = [
  'Сука, опять крипер дом взорвал!',
  'Блять, я упал в лаву со всеми алмазами!',
  'Ебать ты копатель онлайн!',
  'Нахуя я прыгнул в этот каньон?!',
  'Пиздец, где мои факелы?!',
  'Охуеть, 8 алмазов в одной жиле!',
  'Ебаный рот этого казино... где железо?!',
  'Да блять, скелет опять в спину настрелял!',
  'Хули ты смотришь на меня, Эндермен?!',
  'Ебать колотить, вот это гора!',
  'Заебал этот зомби под дверью рычать!',
  'Пизда рулю и два колеса!',
  'Пошел нахуй этот падающий гравий!',
  'Охуенный закат в кубиках!',
  'Бля, опять кирка сломалась на алмазе!',
  'Ебать, меня паук со скалы сбросил!',
  'Хуярь дерево кулаком!',
  'Сука, где мой сундук?!',
  'Какого хуя тут делает крипер в шахте?!',
  'Пиздец котенку... то есть овечке!',
];

// --- Основной пул: каноничные, атмосферные и рофляные цитаты (96.5% шанс) ---
const STANDARD_SPLASHES = [
  // Рофлы и приглушенный юмор
  'Сын Шлю.... ой.. Красавчика!',
  'Еб... твою ж медь, сколько тут угля!',
  'Бл...яха-муха, опять крипер за спиной!',
  'Какого х...удожника тут так темно?!',
  'Опять прое... потерял все алмазы в лаве!',
  'Иди нах...одку в глубокую шахту!',
  'Пиз...дец как красиво на закате!',
  'Сук...уленты не растут в пещерах!',
  'Ё...карный бабай, скелет-снайпер!',
  'Ну ты и долб...ыватель булыжника!',
  'Ах ты ж бл...инчик горелый!',
  'Х...ороший денек чтобы покопать!',
  'Ох...уительно вкусная свинина!',
  'Ни х...рена себе каньон!',
  'Пи...пец зомби приперлись!',
  'Еб...ать копать, я нашел золото!',
  'Чё за х...рень тут заспавнилась?!',
  'Мудила... ой, милый крипер!',
  'Не выё...живайся и строй коробку!',
  'Слышь, ты чё такой дерзкий, зомби?!',
  
  // Геймерские мемы
  'Копатель онлайн 2026!',
  'А ты нажал F3?',
  'Я случайно съел гнилую плоть...',
  'Стив устал и хочет спать',
  'Кто украл мой верстак?!',
  'Построй дворец, живи в яме 3х3',
  'Алмазы не сделают тебя счастливым (сделают)',
  'Убей свинью — получи стейк!',
  'Легендарная кирка на +10 к понтам',
  'Опять ночь, опять страдать',
  'Посади дерево, вырасти дом',
  'Ты точно сохранился?',
  'Секретный сплэш #1337!',
  'Пасхалка для внимательных!',
  'Стример плачет из-за крипера',
  'Овечка смотрит прямо тебе в душу',
  'Не смотри на эндермена!',
  'А ты умеешь крафтить лодку?',
  '1000 блоков до дома пешком!',
  'Секретный сид 666... не проверяй!',
  'Осторожно: высокохудожественный пиксель-арт!',
  'Скрафтил кирку — пошел ломать жизнь',
  'Гриферов нет, но ты держись!',
  'Тнт в шахте — лучшая идея (нет)',
  'Апнул деревянный топор!',
  'Кубический шедевр!',
  'Твой внутренний архитектор в шоке',
  'Шаг влево, шаг вправо — падение в бездну!',
  'Press Alt+F4 for free diamonds!',
  'Мама, я в кубиках!',
  'Крипер? Оооо мэн...',
  'Шахтер года!',
  'Ты точно поел жареную свинину?',
  'ProjectCraft: Лучше чем уроки!',
  'Где мой дом? Я потерялся!',
  'Построй коробку из грязи!',

  // Каноничные тексты Minecraft
  'Also Try Original Minecraft!',
  'Also try Terraria!',
  'ProjectCraft 1.0 Alpha!',
  'ProjectCraft - Build, Survive, Explore!',
  'Не копай прямо под себя!',
  'Херобрин уже наблюдает...',
  '100% без лагов (наверное)!',
  'C418 в наших сердцах!',
  'Осторожно, криперы сзади!',
  'Алмазы на глубине Y=5!',
  'Свиньи умеют летать? Нет.',
  'Скрафти верстак на кнопку E!',
  'Сделано с любовью и чаем!',
  'Бедрок сломать невозможно!',
  'Нотч одобряет!',
  'Кубический мир затягивает!',
  'Скелеты стреляют без промаха!',
  'Зомби стучат в дверь...',
  'Бесконечный процедурный мир!',
  'Печка плавит железную руду!',
  'Овцы дают шерсть на кровати!',
  'Не забудь скрафтить факелы!',
  'Made with React & Three.js!',
  'Smooth 60 FPS Voxel Engine!',
  'Look, a sheep!',
  'Subwoofer Lullaby играет в душе',
  'Туман скрывает монстров...',
  'Поставь факел, не будь нубом!',
  'Кожаные штаны дают стиль!',
  'Железная кирка — ключ к алмазам!',
  'Ночь темна и полна зомби!',
  'Деревянная кирка: Начало легенды',
  'Гравий падает... береги голову!',
  'Вода спасает от падения!',
  'Кастомный сид для каждого мира!',
  'Swedish game design at its finest!',
  'Blocks everywhere!',
  'Listen to the calm piano notes',
  'Crafting Table is your best friend',
  'Smelt your ores in the Furnace',
  'Watch out for dark caves',
  'Day passes, night arrives',
  'Infinite creative potential',
  'Explore massive mountain ranges',
  'The sun rises in the east',
  'Don\'t forget to eat your food',
  'Your story begins now!',
  'Breathe the fresh mountain air',
  'A lonely wanderer in an infinite world',
  'Stars shine bright above the clouds',
  'Deep caverns hold ancient treasures',
  'Sunrise brings a new day of mining',
  'Кликни по этому тексту для новой фразы!',
];

const getRandomSplash = (prev?: string): string => {
  // Редкий шанс ~3.5% для жесткого мата, 96.5% для обычных и рофляных цитат
  const isRareExplicit = Math.random() < 0.035;
  const pool = isRareExplicit ? RARE_EXPLICIT_SPLASHES : STANDARD_SPLASHES;
  let chosen = pool[Math.floor(Math.random() * pool.length)];
  if (chosen === prev && pool.length > 1) {
    chosen = pool[(pool.indexOf(chosen) + 1) % pool.length];
  }
  return chosen;
};

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  isMobileMode,
  onToggleMobileMode,
  seed,
  onRegenerateWorld,
  onOpenSettings,
}) => {
  const [splash, setSplash] = useState(() => getRandomSplash());
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [inputSeed, setInputSeed] = useState(seed.toString());

  const rollNextSplash = () => {
    setSplash((prev) => getRandomSplash(prev));
  };

  const handleApplySeed = () => {
    const num = parseInt(inputSeed, 10);
    if (!isNaN(num)) {
      onRegenerateWorld(num);
    } else {
      // Hash string seed
      let hash = 0;
      for (let i = 0; i < inputSeed.length; i++) {
        hash = (hash << 5) - hash + inputSeed.charCodeAt(i);
        hash |= 0;
      }
      onRegenerateWorld(Math.abs(hash));
    }
    setShowSeedModal(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '40px 16px',
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(2px)',
        userSelect: 'none',
        pointerEvents: 'auto',
      }}
    >
      {/* Top Title & Splash */}
      <div style={{ position: 'relative', marginTop: '20px', textAlign: 'center' }}>
        {/* ProjectCraft Pixel Logo */}
        <div
          style={{
            fontFamily: 'monospace',
            fontWeight: '900',
            fontSize: 'min(7.5vw, 56px)',
            color: '#c6c6c6',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            textShadow:
              '4px 4px 0px #373737, 7px 7px 0px #1f1f1f, 10px 10px 15px rgba(0,0,0,0.8)',
            transform: 'scaleY(1.1)',
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.6))',
          }}
        >
          PROJECTCRAFT
        </div>
        <div
          style={{
            fontFamily: 'monospace',
            fontWeight: 'bold',
            fontSize: '14px',
            letterSpacing: '3px',
            color: '#facc15',
            textShadow: '2px 2px 0px #000',
            marginTop: '2px',
          }}
        >
          ALPHA v1.0.0
        </div>

        {/* Yellow Bouncing Splash Text (Click to roll next!) */}
        <div
          onClick={rollNextSplash}
          title="Кликни для следующей цитаты!"
          style={{
            position: 'absolute',
            right: '-30px',
            bottom: '-14px',
            color: '#facc15',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            fontSize: 'min(3.8vw, 20px)',
            transform: 'rotate(-18deg)',
            textShadow: '2px 2px 0px #854d0e',
            animation: 'splashWiggle 1.5s ease-in-out infinite alternate',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
          }}
        >
          {splash}
        </div>
      </div>

      <style>{`
        @keyframes splashWiggle {
          0% { transform: rotate(-18deg) scale(0.95); }
          100% { transform: rotate(-18deg) scale(1.08); }
        }
        .mc-btn:hover {
          background-color: #5c5c5c !important;
        }
      `}</style>

      {/* Main Buttons Menu */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '380px',
          maxWidth: '90vw',
        }}
      >
        <button
          className="mc-btn"
          onClick={onStartGame}
          style={{
            backgroundColor: '#4e4e4e',
            color: '#ffffff',
            padding: '14px',
            fontSize: '18px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            cursor: 'pointer',
            borderTop: '3px solid #dbdbdb',
            borderLeft: '3px solid #dbdbdb',
            borderRight: '3px solid #1e1e1e',
            borderBottom: '3px solid #1e1e1e',
            textShadow: '2px 2px #1e1e1e',
            boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
            transition: 'background 0.15s',
          }}
        >
          ⚔️ Одиночная игра (Играть)
        </button>

        <button
          className="mc-btn"
          onClick={() => setShowSeedModal(true)}
          style={{
            backgroundColor: '#4e4e4e',
            color: '#ffffff',
            padding: '12px',
            fontSize: '16px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            cursor: 'pointer',
            borderTop: '3px solid #dbdbdb',
            borderLeft: '3px solid #dbdbdb',
            borderRight: '3px solid #1e1e1e',
            borderBottom: '3px solid #1e1e1e',
            textShadow: '2px 2px #1e1e1e',
            boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
          }}
        >
          🌍 Генерация мира (Seed: {seed})
        </button>

        {onOpenSettings && (
          <button
            className="mc-btn"
            onClick={onOpenSettings}
            style={{
              backgroundColor: '#4e4e4e',
              color: '#ffffff',
              padding: '12px',
              fontSize: '16px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              cursor: 'pointer',
              borderTop: '3px solid #dbdbdb',
              borderLeft: '3px solid #dbdbdb',
              borderRight: '3px solid #1e1e1e',
              borderBottom: '3px solid #1e1e1e',
              textShadow: '2px 2px #1e1e1e',
              boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
            }}
          >
            ⚙️ Настройки (Options)
          </button>
        )}

        <button
          className="mc-btn"
          onClick={onToggleMobileMode}
          style={{
            backgroundColor: isMobileMode ? '#15803d' : '#4e4e4e',
            color: '#ffffff',
            padding: '12px',
            fontSize: '15px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            cursor: 'pointer',
            borderTop: '3px solid #dbdbdb',
            borderLeft: '3px solid #dbdbdb',
            borderRight: '3px solid #1e1e1e',
            borderBottom: '3px solid #1e1e1e',
            textShadow: '2px 2px #1e1e1e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {isMobileMode ? <Smartphone size={18} /> : <Monitor size={18} />}
          <span>Режим: {isMobileMode ? 'Телефон / Планшет' : 'Компьютер (ПК)'}</span>
        </button>
      </div>

      {/* Bottom Footer Details */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          color: '#e5e7eb',
          fontFamily: 'monospace',
          fontSize: '13px',
          textShadow: '1px 1px 2px #000',
        }}
      >
        <span style={{ fontWeight: 'bold', color: '#facc15' }}>ProjectCraft 1.0 Alpha</span>
        <span>C418 Volume Alpha OST &bull; 100% Offline</span>
      </div>

      {/* Seed Generator Modal */}
      {showSeedModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 90,
          }}
        >
          <div
            style={{
              backgroundColor: '#c6c6c6',
              padding: '20px',
              borderTop: '3px solid #fff',
              borderLeft: '3px solid #fff',
              borderRight: '3px solid #373737',
              borderBottom: '3px solid #373737',
              width: '360px',
              fontFamily: 'monospace',
            }}
          >
            <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '10px' }}>
              Настройка генерации мира
            </div>
            <div style={{ fontSize: '13px', marginBottom: '6px' }}>Семя генератора (Seed):</div>
            <input
              type="text"
              value={inputSeed}
              onChange={(e) => setInputSeed(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                fontFamily: 'monospace',
                backgroundColor: '#000',
                color: '#fff',
                border: '2px solid #555',
                marginBottom: '14px',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setInputSeed(Math.floor(Math.random() * 999999).toString())}
                style={{
                  backgroundColor: '#4e4e4e',
                  color: '#fff',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  border: '2px solid #333',
                  fontFamily: 'monospace',
                }}
              >
                🎲 Случайный
              </button>
              <button
                onClick={handleApplySeed}
                style={{
                  backgroundColor: '#16a34a',
                  color: '#fff',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  border: '2px solid #14532d',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                }}
              >
                Создать мир
              </button>
              <button
                onClick={() => setShowSeedModal(false)}
                style={{
                  backgroundColor: '#9ca3af',
                  color: '#000',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  border: '2px solid #6b7280',
                  fontFamily: 'monospace',
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
