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
      <svg
        width={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
        height={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={sizeClasses[size]}
      >
        <rect width="40" height="40" rx="8" fill="#0A2540"/>
        <path d="M20 8L28 14L20 20L12 14L20 8Z" fill="#00D4AA"/>
        <path d="M12 14L20 20V28L12 22V14Z" fill="#00D4AA" opacity="0.8"/>
        <path d="M28 14L20 20V28L28 22V14Z" fill="#00D4AA" opacity="0.6"/>
        <path d="M20 20L12 26L20 32L28 26L20 20Z" fill="#00D4AA" opacity="0.9"/>
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