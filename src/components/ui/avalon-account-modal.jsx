import { AlertCircle, X } from 'lucide-react'
import { Button } from './button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from './card.jsx'

const AvalonAccountModal = ({ isOpen, onClose, email }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-lg">Conta já existe na Avalon</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">
              O e-mail <strong>{email}</strong> já possui uma conta na Avalon Broker.
            </p>
            <p className="mb-4">
              Para criar uma conta no Alpha Bot, você precisa usar um e-mail diferente que não esteja registrado na Avalon.
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-1">Por que isso acontece?</p>
                <p>
                  O Alpha Bot cria automaticamente uma conta na Avalon para você. 
                  Se você já tem uma conta na Avalon com este e-mail, precisamos de um e-mail diferente.
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Entendi
            </Button>
            <Button
              onClick={onClose}
              className="flex-1"
            >
              Usar outro e-mail
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AvalonAccountModal
