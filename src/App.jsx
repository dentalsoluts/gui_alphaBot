import { useState } from 'react'
import LoginPage from './components/LoginPage.jsx'
import RegisterGuide from './components/RegisterGuide.jsx'
import TradingDashboard from './components/TradingDashboard.jsx'
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState(null)
  const [showRegister, setShowRegister] = useState(false)

  const handleLoginSuccess = (user) => {
    setUserData(user)
    setIsLoggedIn(true)
    setShowRegister(false) // Volta para login após sucesso
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserData(null)
    setShowRegister(false)
  }

  const handleGoToRegister = () => {
    setShowRegister(true)
  }

  const handleBackToLogin = () => {
    setShowRegister(false)
  }

  return (
    <div className="app">
      {!isLoggedIn ? (
        showRegister ? (
          <RegisterGuide 
            onBackToLogin={handleBackToLogin} 
            onRegisterSuccess={handleLoginSuccess}
          />
        ) : (
          <LoginPage 
            onLoginSuccess={handleLoginSuccess} 
            onGoToRegister={handleGoToRegister}
          />
        )
      ) : (
        <TradingDashboard userData={userData} onLogout={handleLogout} />
      )}
    </div>
  )
}

export default App

