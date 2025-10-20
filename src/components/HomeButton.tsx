import { useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { Home } from 'lucide-react'
import { motion } from 'framer-motion'

const HomeButton = () => {
  const navigate = useNavigate()

  return (
    <motion.div
      className="fixed bottom-6 left-6 z-40"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <Button
        onClick={() => navigate('/')}
        variant="outline"
        size="sm"
        className="bg-white shadow-md hover:shadow-lg transition-shadow"
        aria-label="Voltar para página inicial"
      >
        <Home className="w-4 h-4 mr-2" />
        Início
      </Button>
    </motion.div>
  )
}

export default HomeButton