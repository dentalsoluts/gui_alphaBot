import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import './LoginPage.css'

const RegisterGuide = ({ onBackToLogin, onRegisterSuccess }) => {
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')

  // Mock de contas existentes na Avalon (substitua por sua lógica real)
  const existingAvalonAccounts = [
    'gus.barretogg@gmail.com',
    'contaexistente@email.com',
    'usuario@avalon.com',
    'abc@teste.com'
  ]

  const handleRegister = async (e) => {
    e.preventDefault()
    
    if (!registerData.name || !registerData.email || !registerData.password) {
      setRegisterError('Por favor, preencha todos os campos')
      return
    }

    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError('As senhas não coincidem')
      return
    }

    if (registerData.password.length < 6) {
      setRegisterError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setRegisterLoading(true)
    setRegisterError('')

    try {
      // Verifica se a conta JÁ EXISTE na Avalon (mock)
      const accountExistsInAvalon = existingAvalonAccounts.includes(registerData.email.toLowerCase())
      
      if (accountExistsInAvalon) {
        setRegisterError('❌ Este e-mail já possui conta na Avalon. Use um e-mail diferente para criar no Alpha Bot.')
        return
      }

      // Simula criação de conta no Alpha Bot (substitua por sua API real)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock: Salva no localStorage (substitua por sua API)
      const alphaBotUsers = JSON.parse(localStorage.getItem('alphaBotUsers') || '[]')
      const newUser = {
        id: Date.now(),
        name: registerData.name,
        email: registerData.email,
        password: registerData.password, // Em produção, hash essa senha!
        createdAt: new Date().toISOString(),
        balance: 10000.00
      }
      
      alphaBotUsers.push(newUser)
      localStorage.setItem('alphaBotUsers', JSON.stringify(alphaBotUsers))

      // Login automático no Alpha Bot
      const userData = {
        email: registerData.email,
        balance: 10000.00,
        name: registerData.name,
        isAlphaBotAccount: true
      }
      
      onRegisterSuccess(userData)

    } catch (error) {
      console.error('Erro no cadastro:', error)
      setRegisterError('Erro ao criar conta. Tente novamente.')
    } finally {
      setRegisterLoading(false)
    }
  }

  const checkAvalonAccountExists = (email) => {
    // Verificação mock - substitua por verificação real na Avalon
    return existingAvalonAccounts.includes(email.toLowerCase())
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

        {/* Card de Cadastro */}
        <Card className="login-card">
          <CardHeader>
            <div className="guide-header">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToLogin}
                className="back-button"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <CardTitle className="login-title">
                Criar Conta Alpha Bot
              </CardTitle>
              <div style={{width: '80px'}}></div> {/* Espaço para alinhamento */}
            </div>
            <p className="login-subtitle">
              Crie sua conta no Alpha Bot e comece a operar com nossa Inteligência Artificial
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleRegister} className="register-form">
              <div className="form-group">
                <Input
                  type="text"
                  placeholder="Nome completo"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                  disabled={registerLoading}
                  className="login-input"
                />
              </div>
              
              <div className="form-group">
                <Input
                  type="email"
                  placeholder="E-mail"
                  value={registerData.email}
                  onChange={(e) => {
                    setRegisterData({...registerData, email: e.target.value})
                    // Verificação em tempo real
                    if (e.target.value && checkAvalonAccountExists(e.target.value)) {
                      setRegisterError('⚠️ Este e-mail já tem conta na Avalon. Use um e-mail diferente.')
                    } else if (registerError && registerError.includes('Avalon')) {
                      setRegisterError('')
                    }
                  }}
                  disabled={registerLoading}
                  className="login-input"
                />
              </div>
              
              <div className="form-group">
                <Input
                  type="password"
                  placeholder="Senha (mínimo 6 caracteres)"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  disabled={registerLoading}
                  className="login-input"
                />
              </div>
              
              <div className="form-group">
                <Input
                  type="password"
                  placeholder="Confirmar senha"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                  disabled={registerLoading}
                  className="login-input"
                />
              </div>
              
              {registerError && (
                <Alert className={
                  registerError.includes('✅') 
                    ? 'success-alert' 
                    : registerError.includes('❌') || registerError.includes('⚠️')
                    ? 'warning-alert'
                    : 'login-alert'
                }>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{registerError}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                type="submit"
                className="login-button"
                disabled={registerLoading || checkAvalonAccountExists(registerData.email)}
              >
                {registerLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar Conta Alpha Bot'
                )}
              </Button>

              <div className="features-list">
                <div className="feature-item">
                  <CheckCircle className="feature-icon" />
                  <span>Conta demo com $10.000</span>
                </div>
                <div className="feature-item">
                  <CheckCircle className="feature-icon" />
                  <span>Acesso à Inteligência Alpha</span>
                </div>
                <div className="feature-item">
                  <CheckCircle className="feature-icon" />
                  <span>Conta Avalon criada automaticamente</span>
                </div>
                <div className="feature-item">
                  <CheckCircle className="feature-icon" />
                  <span>Suporte completo</span>
                </div>
              </div>

              <div className="modal-footer">
                <p className="footer-text">
                  Já tem conta Alpha Bot? <button 
                    type="button" 
                    className="footer-link"
                    onClick={onBackToLogin}
                  >
                    Faça login aqui
                  </button>
                </p>
              </div>
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

export default RegisterGuide