import React from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Routes from './routes';

toast.configure();

function App() {
  return (
    <Routes />
  );
}

export default App;