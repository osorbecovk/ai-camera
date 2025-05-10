import React, { useState, useRef, useEffect } from 'react';
import { Camera } from 'lucide-react';
import './Home.scss'; // SCSS стили импорттоо

const Home = () => {
  const [modal, setModal] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);

  // Камераларды алуу
  const getVideoDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      
      if (videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
      
      console.log('Жеткиликтүү камералар:', videoDevices);
    } catch (err) {
      console.error('Камераларды алууда ката:', err);
    }
  };

  // Компонент жүктөлгөндө камераларды алуу
  useEffect(() => {
    getVideoDevices();
  }, []);

  // Камерага доступ суроо
  const requestCameraAccess = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      console.log('Камера ачуу процесси башталды');
      console.log('Тандалган камера ID:', selectedCamera);
      
      const constraints = {
        video: selectedCamera 
          ? { deviceId: { exact: selectedCamera }, width: 1280, height: 720 } 
          : { facingMode: 'user', width: 1280, height: 720 }
      };
      
      console.log('Колдонулган параметрлер:', constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Камера агымы алынды:', stream);
      
      if (!stream) {
        throw new Error('Камера агымы алынган жок');
      }
      
      streamRef.current = stream;
      
      // Биринчи камераны ачабыз, анан видео элементин орнотобуз
      setIsCameraOpen(true);
      setModal(false);
      
      // setTimeout колдонуп, DOM элементи жүктөлгөнүн күтөбүз
      setTimeout(() => {
        if (videoRef.current) {
          console.log('Видео элементи табылды:', videoRef.current);
          videoRef.current.srcObject = stream;
          
          // Видео события
          videoRef.current.onloadedmetadata = () => {
            console.log('Видео метадата жүктөлдү');
          };
          
          videoRef.current.onplay = () => {
            console.log('Видео ойноп жатат');
            setError(null);
          };
          
          videoRef.current.onerror = (e) => {
            console.error('Видео элементинде ката:', e);
            setError('Видео жүктөөдө ката кетти');
          };
          
          // Видеону ойнотуу
          try {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => console.log('Видео ойнотулду'))
                .catch(err => {
                  console.error('Видеону ойнотууда ката:', err);
                  setError('Видеону ойното албадык. Браузер уруксаттарын текшериңиз.');
                });
            }
          } catch (err) {
            console.error('Видеону ойнотууда ката:', err);
            setError('Видеону ойнотууда ката кетти');
          }
        } else {
          console.error('videoRef жок, элемент табылган жок');
          setError('Видео элементи табылган жок');
        }
      }, 100); // 100ms күтөбүз DOM жүктөлүшү үчүн
    } catch (err) {
      console.error('Камера ачууда ката:', err);
      setError(`Камерага жетүү мүмкүн эмес: ${err.message}`);
    }
  };

  // Камераны жабуу
  const closeCamera = () => {
    console.log('Камераны жабуу...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        console.log('Трек токтотулду:', track.label);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCameraOpen(false);
  };

  // Кадрды талдоо
  const analyzeFrame = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.log('videoRef же canvasRef жок');
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Видео ойноп жатабы текшерүү
    if (video.paused || video.ended || !video.videoWidth) {
      console.log('Видео даяр эмес:', {
        paused: video.paused,
        ended: video.ended,
        videoWidth: video.videoWidth
      });
      return;
    }

    canvas.width = 320;
    canvas.height = 240;

    const ctx = canvas.getContext('2d');
    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      console.log('Кадр алынды, узундугу:', imageData.length);
      
      // API бар болсо, маалыматты жөнөтүү:
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
    } catch (err) {
      console.error('Кадр алууда ката:', err);
    }
  };

  // Кадрларды анализдөө интервал менен
  useEffect(() => {
    let interval;
    
    // Камера ачылгандан кийин бираз күтөбүз
    const setupInterval = () => {
      if (isCameraOpen) {
        setTimeout(() => {
          if (videoRef.current && streamRef.current) {
            console.log('Кадрларды анализдөө иштетилди');
            interval = setInterval(() => {
              if (videoRef.current && !videoRef.current.paused) {
                analyzeFrame();
              }
            }, 500);
          } else {
            console.log('Видео элементи же агым табылган жок, дагы аракет жасайбыз...');
            setupInterval(); // Видео элементи жүктөлгөнчө кайра аракет жасайбыз
          }
        }, 500);
      }
    };
    
    setupInterval();
    
    return () => {
      if (interval) {
        clearInterval(interval);
        console.log('Кадр анализи токтотулду');
      }
    };
  }, [isCameraOpen]);

  // useEffect кошобуз videoRef абалын көзөмөлдөө үчүн
  useEffect(() => {
    console.log('videoRef абалы өзгөрдү:', videoRef.current);
  }, [videoRef.current]);

  return (
    <section id="home">
      <div className="container">
        {error && (
          <div className="error">
            {error}
          </div>
        )}
        
        {!isCameraOpen ? (
          <div className="camera-button-container">
            <button
              className="home--button"
              onClick={() => setModal(true)}
              aria-label="Камераны ачуу"
            >
              <Camera size={50} />
            </button>
            <p className="camera-text">Камераны ачуу үчүн басыңыз</p>
          </div>
        ) : (
          <div className="camera--preview" id="camera-preview-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              width="100%"
              height="auto"
              id="camera-video-element"
              onLoadedMetadata={() => console.log('Video metadata loaded')}
              onCanPlay={() => console.log('Video can play now')}
            />
            <div className="video-status">{streamRef.current ? 'Камера иштеп жатат' : 'Камера жүктөлүүдө...'}</div>
            <button 
              onClick={closeCamera} 
              className="close--button"
              aria-label="Камераны жабуу"
            >
              ×
            </button>
          </div>
        )}
        
        {modal && (
          <div className="modal">
            <div className="modal--content">
              <h3>Камерага уруксат</h3>
              
              {devices.length > 0 && (
                <div className="camera-select">
                  <label>Камераны тандаңыз:</label>
                  <select 
                    value={selectedCamera || ''}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                  >
                    {devices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Камера ${devices.indexOf(device) + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <p>Башкаруу үчүн камерага уруксат бериңиз.</p>
              
              <div className="modal--buttons">
                <button 
                  onClick={() => setModal(false)} 
                  className="cancel-button"
                  aria-label="Жокко чыгаруу"
                >
                  Жокко чыгаруу
                </button>
                <button 
                  onClick={requestCameraAccess} 
                  className="confirm-button"
                  aria-label="Уруксат берүү"
                >
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