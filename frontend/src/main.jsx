import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'

// 1. 引入中文语言包
import { zhCN } from '@clerk/localizations'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. 在这里添加 localization 属性 */}
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY} 
      localization={zhCN} 
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)
