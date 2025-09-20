import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Bot, AlertCircle, Loader2 } from 'lucide-react'
import avalonSdk from '../services/avalonSdk.js'
import './LoginPage.css'

const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('bxconsultoria@gmail.com')
  const [password, setPassword] = useState('212646@Wagner')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('Por favor, preencha email e senha')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      const result = await avalonSdk.connect(email, password)
      
      if (result.success) {
        // Obter dados do usuário
        const balanceInfo = await avalonSdk.getBalance()
        const userData = {
          email,
          balance: balanceInfo?.demo || balanceInfo?.real || 10950.00,
          name: 'Samuel Martins' // Pode ser extraído do SDK se disponível
        }
        
        onLoginSuccess(userData)
      } else {
        setError(result.message || 'Erro ao conectar com a Avalon')
        window.open('https://trade.avalonbroker.com/register?aff=757660&aff_model=revenue&afftrack=', '_blank')
      }
    } catch (error) {
      console.error('Erro no login:', error)
      setError('Erro de conexão. Verifique suas credenciais.')
      window.open('https://trade.avalonbroker.com/register?aff=757660&aff_model=revenue&afftrack=', '_blank')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Logo */}
        <div className="login-logo">
          <img 
            src="/logoAlphaBot.png" 
            alt="" 
            className="logo-image"
          />
        </div>

        {/* Card de Login */}
        <Card className="login-card">
          <CardHeader>
            <CardTitle className="login-title">
              Inteligência Alpha
            </CardTitle>
            <p className="login-subtitle">
              Acesse sua conta para começar a operar
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <Input
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="login-input"
                />
              </div>
              
              <div className="form-group">
                <Input
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="login-input"
                />
              </div>
              
              {error && (
                <Alert className="login-alert">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                type="submit"
                className="login-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="login-footer">
          <p>Powered by Avalon Broker SDK</p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

