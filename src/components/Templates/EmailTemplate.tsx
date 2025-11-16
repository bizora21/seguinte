import React, { ReactNode } from 'react'

interface EmailTemplateProps {
  title: string
  children: ReactNode
  previewText: string
  recipientName?: string
}

const BASE_URL = 'https://lojarapidamz.com' // Hardcoded para garantir que a imagem seja absoluta

const EmailTemplate: React.FC<EmailTemplateProps> = ({ title, children, previewText, recipientName }) => {
  return (
    <html lang="pt-MZ">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <style>
          {`
            body { font-family: Arial, sans-serif; background-color: #f7f9fa; margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
            .header { background-color: #0A2540; color: #ffffff; padding: 20px; text-align: center; }
            .content { padding: 30px; color: #333333; line-height: 1.6; }
            .footer { background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666666; }
            .preview-text { display: none !important; max-height: 0; overflow: hidden; }
            .logo-container { display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
            .logo-text { font-size: 24px; font-weight: bold; color: #ffffff; margin-left: 8px; }
            
            /* Estilos dos Botões */
            .button-container { text-align: center; margin-top: 25px; margin-bottom: 25px; }
            .button { 
              display: inline-block; 
              padding: 12px 25px; 
              margin: 5px;
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: bold; 
              font-size: 16px;
              line-height: 1.2;
              transition: background-color 0.3s;
            }
            .button-primary {
              background-color: #00D4AA; /* Verde Vibrante */
              color: #ffffff;
              border: 1px solid #00D4AA;
            }
            .button-secondary {
              background-color: #ffffff;
              color: #0A2540; /* Azul Escuro */
              border: 1px solid #0A2540;
            }
            
            /* Responsividade básica */
            @media only screen and (max-width: 600px) {
              .content { padding: 20px; }
              .button { display: block; margin: 10px auto; }
            }
          `}
        </style>
      </head>
      <body>
        <span className="preview-text">{previewText}</span>
        <div style={{ backgroundColor: '#f7f9fa', padding: '20px 0' }}>
          <div className="container">
            <div className="header">
              <div className="logo-container">
                {/* Usando tag <img> para melhor compatibilidade com clientes de e-mail */}
                <img
                  src={`${BASE_URL}/favicon.svg`}
                  alt="LojaRápida Logo"
                  width="40"
                  height="40"
                  style={{ display: 'block', width: '40px', height: '40px' }}
                />
                <span className="logo-text">LojaRápida</span>
              </div>
            </div>
            <div className="content">
              {children}
            </div>
            <div className="footer">
              <p>Este e-mail foi enviado pela LojaRápida, o seu marketplace em Moçambique.</p>
              <p>Se tiver dúvidas, responda a este e-mail ou visite nossa <a href="https://lojarapidamz.com/faq" style={{ color: '#0A2540', textDecoration: 'underline' }}>Central de Ajuda</a>.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

export default EmailTemplate