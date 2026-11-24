import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register service worker for offline play and Android standalone installability
registerSW({
  immediate: true,
});

createRoot(document.getElementById('root')!).render(<App />);
