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
      {/* Novo Ícone SVG: Pin de Localização com Seta de Velocidade */}
      <svg
        width={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
        height={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={sizeClasses[size]}
      >
        {/* Fundo Azul Profundo (Primary) */}
        <rect width="40" height="40" rx="8" fill="#0A2540"/>
        
        {/* Pin de Localização (Branco) */}
        <path d="M20 10C14.477 10 10 14.477 10 20C10 25.523 20 35 20 35C20 35 30 25.523 30 20C30 14.477 25.523 10 20 10ZM20 25C17.2386 25 15 22.7614 15 20C15 17.2386 17.2386 15 20 15C22.7614 15 25 17.2386 25 20C25 22.7614 22.7614 25 20 25Z" fill="white"/>
        
        {/* Seta de Rapidez (Accent Green) */}
        <path d="M20 15L25 20L20 25L15 20L20 15Z" fill="#00D4AA" opacity="0.8"/>
        <path d="M20 15L20 25" stroke="#00D4AA" strokeWidth="2" strokeLinecap="round"/>
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