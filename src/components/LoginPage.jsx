import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { AlertCircle, Loader2 } from 'lucide-react'
import './LoginPage.css'

const LoginPage = ({ onLoginSuccess, onGoToRegister }) => {
  const [email, setEmail] = useState('bxconsultoria@gmail.com')
  const [password, setPassword] = useState('212646@Wagner')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Mock de contas existentes na Avalon (substitua por sua lógica real)
  const existingAvalonAccounts = [
    'bxconsultoria@gmail.com',
    'contaexistente@email.com',
    'usuario@avalon.com'
  ]

  const handleLogin = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('Por favor, preencha email e senha')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      // Verifica se é uma conta Alpha Bot primeiro
      const alphaBotUsers = JSON.parse(localStorage.getItem('alphaBotUsers') || '[]')
      const alphaBotUser = alphaBotUsers.find(user => user.email === email)
      
      if (alphaBotUser) {
        // Login com conta Alpha Bot
        if (alphaBotUser.password === password) {
          const userData = {
            email: alphaBotUser.email,
            balance: alphaBotUser.balance,
            name: alphaBotUser.name,
            isAlphaBotAccount: true
          }
          onLoginSuccess(userData)
          return
        } else {
          setError('Senha incorreta para conta Alpha Bot')
          return
        }
      }

      // Se não é conta Alpha Bot, verifica se é a conta pré-configurada da Avalon
      if (email === 'bxconsultoria@gmail.com' && password === '212646@Wagner') {
        // Login com conta pré-configurada da Avalon
        const userData = {
          email,
          balance: 10950.00,
          name: 'Samuel Martins',
          isAlphaBotAccount: false
        }
        onLoginSuccess(userData)
        return
      }

      // Se não é conta Alpha Bot nem conta pré-configurada, bloqueia o login
      setError('Email ou senha inválidos.')
      //setError('Esta conta não existe no Alpha Bot. Crie uma conta Alpha Bot primeiro.')
      
    } catch (error) {
      console.error('Erro no login:', error)
      setError('Erro de conexão. Verifique suas credenciais.')
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

              <div className="login-divider">
                <span>ou</span>
              </div>

              <Button 
                type="button"
                variant="outline"
                className="register-button"
                onClick={onGoToRegister}
                disabled={isLoading}
              >
                Criar Conta Alpha Bot
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