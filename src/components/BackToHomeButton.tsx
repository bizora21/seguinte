import { useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { Home } from 'lucide-react'
import { motion } from 'framer-motion'

const BackToHomeButton = () => {
  const navigate = useNavigate()

  return (
    <motion.div
      className="fixed bottom-6 left-6 z-40"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => navigate('/')}
          variant="outline"
          size="sm"
          className="bg-white shadow-md hover:shadow-lg transition-shadow border-gray-300"
          aria-label="Retornar à página inicial"
        >
          <Home className="w-4 h-4 mr-2" />
          Página Inicial
        </Button>
      </motion.div>
  )
}

export default BackToHomeButton