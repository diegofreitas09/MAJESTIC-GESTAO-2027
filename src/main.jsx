import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import AuthGate from './AuthGate.jsx';
import './styles.css';
import './gestao-sucesso-catalogo.css';
import './auth-notifications.css';
import './crm-executivo.css';
import './auth.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthGate appName="Majestic Executivo 2027" allowedRoles={['direcao']}>
      {()=> <App/>}
    </AuthGate>
  </React.StrictMode>,
);