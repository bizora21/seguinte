import React, { ReactNode } from 'react'

interface EmailTemplateProps {
  title: string
  children: ReactNode
  previewText: string
}

const EmailTemplate: React.FC<EmailTemplateProps> = ({ title, children, previewText }) => {
  return (
    <html lang="pt-MZ">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <style>
          {`
            body { font-family: Arial, sans-serif; background-color: #f7f9fa; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
            .header { background-color: #0A2540; color: #ffffff; padding: 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; color: #333333; line-height: 1.6; }
            .footer { background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666666; }
            .button { display: inline-block; padding: 10px 20px; margin-top: 20px; background-color: #00D4AA; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; }
            .preview-text { display: none !important; max-height: 0; overflow: hidden; }
            .logo-container { display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
            .logo-text { font-size: 24px; font-weight: bold; color: #ffffff; margin-left: 8px; }
          `}
        </style>
      </head>
      <body>
        <span className="preview-text">{previewText}</span>
        <div style={{ backgroundColor: '#f7f9fa', padding: '20px 0' }}>
          <div className="container">
            <div className="header">
              <div className="logo-container">
                {/* SVG do Logotipo (40x40) */}
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 40 40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ display: 'block' }}
                >
                  {/* Fundo Azul Profundo (#0A2540) - Já é a cor do header, mas mantemos para o SVG */}
                  <rect width="40" height="40" rx="8" fill="#0A2540"/>
                  
                  {/* Sacola de Compras (Branco) */}
                  <path d="M13 15H27L25 30H15L13 15Z" fill="white"/>
                  <path d="M16 15V13C16 11.3431 17.3431 10 19 10H21C22.6569 10 24 11.3431 24 13V15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  
                  {/* Raio (Flash) Verde Vibrante (#00D4AA) */}
                  <path d="M20 20L18 25H22L20 30" stroke="#00D4AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 20L22 25H18L20 30" fill="#00D4AA"/>
                </svg>
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