import { useState } from 'react'
import LoginPage from './components/LoginPage.jsx'
import TradingDashboard from './components/TradingDashboard.jsx'
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState(null)

  const handleLoginSuccess = (user) => {
    setUserData(user)
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserData(null)
  }

  return (
    <div className="app">
      {!isLoggedIn ? (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        <TradingDashboard userData={userData} onLogout={handleLogout} />
      )}
    </div>
  )
}

export default App

