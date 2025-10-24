import { motion } from 'framer-motion'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

const Logo = ({ size = 'md', showText = true }: LogoProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  }

  return (
    <motion.div
      className="flex items-center space-x-2"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Novo Ícone SVG: Sacola de Compras com Raio (Flash) */}
      <svg
        width={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
        height={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={sizeClasses[size]}
      >
        {/* Fundo Azul Profundo (#0A2540) */}
        <rect width="40" height="40" rx="8" fill="#0A2540"/>
        
        {/* Sacola de Compras (Branco) */}
        <path d="M13 15H27L25 30H15L13 15Z" fill="white"/>
        <path d="M16 15V13C16 11.3431 17.3431 10 19 10H21C22.6569 10 24 11.3431 24 13V15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        
        {/* Raio (Flash) Verde Vibrante (#00D4AA) */}
        <path d="M20 20L18 25H22L20 30" stroke="#00D4AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20 20L22 25H18L20 30" fill="#00D4AA"/>
      </svg>
      
      {showText && (
        <span className={`font-bold ${textSizeClasses[size]} text-gray-900`}>
          LojaRápida
        </span>
      )}
    </motion.div>
  )
}

export default Logo