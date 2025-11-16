import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Mail, Users, Store, LayoutTemplate, Eye, User } from 'lucide-react'
import EmailList from './EmailList'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import WelcomeClientEmail from '../Templates/WelcomeClientEmail'
import WelcomeSellerEmail from '../Templates/WelcomeSellerEmail'
import { renderToStaticMarkup } from 'react-dom/server'

const TEMPLATE_PREVIEWS = [
  {
    id: 'welcome_client',
    name: 'Boas-Vindas (Cliente)',
    component: <WelcomeClientEmail name="[Nome do Cliente]" />,
    description: 'Enviado automaticamente após o cadastro de um novo cliente.'
  },
  {
    id: 'welcome_seller',
    name: 'Boas-Vindas (Vendedor)',
    component: <WelcomeSellerEmail storeName="[Nome da Loja]" sellerId="placeholder-seller-id" />,
    description: 'Enviado automaticamente após o cadastro de um novo vendedor.'
  },
  {
    id: 'abandoned_cart',
    name: 'Carrinho Abandonado',
    component: <p className="text-gray-700">Este template é gerado dinamicamente pela função de servidor para incluir os produtos do carrinho.</p>,
    description: 'Enviado 24h após o abandono do carrinho (se a automação estiver ativa).'
  }
]

const EmailTemplateManagerTab: React.FC = () => {
  const [activeList, setActiveList] = useState('clients')

  return (
    <div className="space-y-6">
      {/* Gerenciamento de Listas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Users className="w-6 h-6 mr-2 text-blue-600" />
            Listas de E-mail por Função
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeList} onValueChange={setActiveList}>
            <TabsList className="grid w-full grid-cols-2 h-auto p-1">
              <TabsTrigger value="clients" className="py-2 text-sm flex items-center">
                <User className="w-4 h-4 mr-1" /> Clientes
              </TabsTrigger>
              <TabsTrigger value="sellers" className="py-2 text-sm flex items-center">
                <Store className="w-4 h-4 mr-1" /> Vendedores
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clients" className="mt-4">
              <EmailList role="cliente" />
            </TabsContent>
            <TabsContent value="sellers" className="mt-4">
              <EmailList role="vendedor" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Gerenciamento de Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <LayoutTemplate className="w-6 h-6 mr-2 text-purple-600" />
            Templates de E-mail (Visualização)
          </CardTitle>
          <p className="text-sm text-gray-600">Visualize os modelos de e-mail usados pelas automações.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {TEMPLATE_PREVIEWS.map(template => (
            <div key={template.id} className="p-4 border rounded-lg flex items-center justify-between bg-gray-50">
              <div>
                <p className="font-medium">{template.name}</p>
                <p className="text-xs text-gray-600">{template.description}</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" /> Preview
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl p-0">
                  <DialogHeader className="p-4 border-b">
                    <DialogTitle>{template.name}</DialogTitle>
                  </DialogHeader>
                  <div className="p-4 overflow-y-auto max-h-[80vh]">
                    {/* Renderiza o template dentro do iframe para isolamento de estilos */}
                    <iframe
                      srcDoc={template.id === 'abandoned_cart' ? `<html><body>${template.component}</body></html>` : renderToStaticMarkup(template.component)}
                      title={`Preview ${template.name}`}
                      className="w-full border-0"
                      style={{ height: '600px' }}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default EmailTemplateManagerTab