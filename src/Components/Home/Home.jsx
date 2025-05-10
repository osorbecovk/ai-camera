import React, { useState, useRef, useEffect } from 'react';
import { IoCameraOutline } from 'react-icons/io5';

const Home = () => {
  const [modal, setModal] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  // Запрос доступа к камере
  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 }, // Фронтальная камера, HD
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      setModal(false);
      setError(null);
    } catch (err) {
      setError('Камерага жетүү мүмкүн болгон жок. Уруксаттарды текшериңиз.');
      console.error('Ката:', err);
    }
  };

  // Подключение видеопотока
  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => {
        setError('Видеону ойнотууда ката кетти. Браузерди текшериңиз.');
        console.error('Видео ката:', err);
      });
    }

    // Очистка потока
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isCameraOpen]);

  // Закрытие камеры
  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  // Захват и отправка кадра на бэкенд (для ИИ)
  const analyzeFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = 320;
    canvas.height = 240;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    console.log('Кадр даяр:', imageData); // Отладка
    /*
    fetch('https://your-backend.com/analyze-gesture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('ИИ жооп:', data);
      })
      .catch((err) => console.error('API ката:', err));
    */
  };

  // Анализ кадров
  useEffect(() => {
    let interval;
    if (isCameraOpen) {
      interval = setInterval(analyzeFrame, 500);
    }
    return () => clearInterval(interval);
  }, [isCameraOpen]);

  return (
    <section id="home">
      <div className="container">
        {error && <div className="error">{error}</div>}
        {!isCameraOpen ? (
          <button
            className="home--button"
            onClick={() => setModal(true)}
            aria-label="Камераны ачуу"
          >
            <IoCameraOutline />
          </button>
        ) : (
          <div className="camera--preview">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ transform: 'scaleX(-1)' }} // Зеркалим для "селфи"
            />
            <button onClick={closeCamera} className="close--button" aria-label="Камераны жабуу">
              ×
            </button>
          </div>
        )}
        {modal && (
          <div className="modal">
            <div className="modal--content">
              <h3>Камерага уруксат</h3>
              <p>Башкаруу үчүн камерага уруксат бериңиз.</p>
              <div className="modal--buttons">
                <button onClick={() => setModal(false)} aria-label="Жокко чыгаруу">
                  Жокко чыгаруу
                </button>
                <button onClick={requestCameraAccess} aria-label="Уруксат берүү">
                  Уруксат берүү
                </button>
              </div>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </section>
  );
};

export default Home;