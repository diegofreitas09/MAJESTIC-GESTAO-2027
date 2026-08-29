import React from 'react';
import ReactDOM from 'react-dom/client';
import EquipeApp from './EquipeApp.jsx';
import AuthGate from './AuthGate.jsx';
import './styles.css';
import './gestao-sucesso-catalogo.css';
import './equipe-app.css';
import './atendimento-crm.css';
import './auth.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthGate appName="Majestic Atendimento 2027" allowedRoles={['gestao','matricula']}>
      {({profile,logout})=> <EquipeApp profile={profile} logout={logout}/>} 
    </AuthGate>
  </React.StrictMode>,
);