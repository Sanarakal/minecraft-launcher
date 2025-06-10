// client/src/App.tsx
import React, { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import './App.css';

const API = 'http://89.104.67.130:4000';
// Путь к изображению, на которое будут «перевёрнуты» кубики
const TARGET_IMG = 'assets/flip-target.png';

export default function App() {
  const [username, setUsername] = useState('');
  const [serverIp, setServerIp] = useState('');
  const [status,   setStatus]   = useState('⏳ Подключение…');
  const [ready,    setReady]    = useState(false);
  // Используем React.ReactElement вместо JSX.Element
  const [pieces,   setPieces]   = useState<React.ReactElement[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  const ROWS = 10, COLS = 15;
  const TOTAL = ROWS * COLS;
  const DELAY = 30;   // мс между кубиками
  const DURA  = 300;  // длительность анимации одного кубика

  useEffect(() => {
    fetch(`${API}/api/server-info`)
      .then(r => r.json())
      .then(d => {
        setServerIp(d.port === 25565 ? d.ip : `${d.ip}:${d.port}`);
        setStatus(`✅ Сервер: ${d.ip}`);
        setReady(true);
      })
      .catch(() => setStatus('❌ Сервер недоступен'));
  }, []);

  const play = async () => {
    if (!username.trim()) {
      setStatus('❌ Введите ник');
      return;
    }

    setStatus('🚀 Запуск Minecraft…');

    // 1. Запускаем Minecraft (detached)
    window.electron.invoke('launch-minecraft', {
      username,
      serverIp,
      version: '1.21.5',
      javaPath:
        'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.7.6-hotspot\\bin\\java.exe',
    }).catch(console.error);

    // 2. Снимок UI и разбивка на кусочки
    const node = contentRef.current!;
    const canvas = await html2canvas(node, { backgroundColor: null });
    const { width, height } = canvas;
    const cellW = width  / COLS;
    const cellH = height / ROWS;
    const ctx = canvas.getContext('2d')!;

    // Подготовка изображения назначения
    const targetImg = await new Promise<HTMLImageElement>((res, rej) => {
      const img = new Image();
      img.src = TARGET_IMG;
      img.onload = () => res(img);
      img.onerror = rej;
    });
    const targetCanvas = document.createElement('canvas');
    targetCanvas.width = width;
    targetCanvas.height = height;
    const tCtx = targetCanvas.getContext('2d')!;
    tCtx.drawImage(targetImg, 0, 0, width, height);

    // Полные изображения для фона плиток
    const frontUrl = canvas.toDataURL();
    const backUrl  = targetCanvas.toDataURL();

    // Случайный порядок индексов
    const order = Array.from({ length: TOTAL }, (_, i) => i).sort(
      () => Math.random() - 0.5
    );

    // Генерируем React элементы-кусочки
    const newPieces: React.ReactElement[] = order.map((idx, n) => {
      const r = Math.floor(idx / COLS);
      const c = idx % COLS;

      const position = `-${c * cellW}px -${r * cellH}px`;

      return (
        <div
          key={idx}
          className="piece"
          style={{
            width:  cellW,
            height: cellH,
            left:   c * cellW,
            top:    r * cellH,
            animationDelay:    `${n * DELAY}ms`,
            animationDuration: `${DURA}ms`,
          }}
        >
          <div
            className="face front"
            style={{
              backgroundImage: `url(${frontUrl})`,
              backgroundSize: `${width}px ${height}px`,
              backgroundPosition: position,
            }}
          />
          <div
            className="face back"
            style={{
              backgroundImage: `url(${backUrl})`,
              backgroundSize: `${width}px ${height}px`,
              backgroundPosition: position,
            }}
          />
        </div>
      );
    });

    // 3. Скрываем оригинальный UI и показываем кусочки
    setPieces(newPieces);

    // 4. Закрываем окно по окончании анимации
    const totalTime = order.length * DELAY + DURA + 50;
    setTimeout(() => window.electron.invoke('close-window'), totalTime);
  };

  return (
    <div className="app-container">
      {/* Отрисовка кусочков поверх окна */}
      {pieces}

      {/* Исходный интерфейс */}
      <div
        className="content"
        ref={contentRef}
        style={{ visibility: pieces.length ? 'hidden' : 'visible' }}
      >
        <h1>SexCraft Launcher</h1>
        <input
          className="input"
          placeholder="Введите ник"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <button
          className="play-button"
          onClick={play}
          disabled={!ready}
        >
          Играть
        </button>
        <p className="status">{status}</p>
      </div>
    </div>
  );
}
