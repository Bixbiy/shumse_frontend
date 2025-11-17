import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SocketProvider } from './context/SocketContext.jsx'
const queryClient = new QueryClient();
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
 <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <App />
      </SocketProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
)