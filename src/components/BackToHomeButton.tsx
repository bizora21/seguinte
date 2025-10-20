import { useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'
import { motion } from 'framer-motion'

const BackToHomeButton = () => {
  const navigate = useNavigate()

  return (
    <motion.div
      className="fixed bottom-6 left-6 z-40 cursor-pointer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate('/')}
      aria-label="Retornar à página inicial"
    >
      <div className="bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-300 px-4 py-2 rounded-lg flex items-center text-sm font-medium text-gray-700 hover:bg-gray-50">
        <Home className="w-4 h-4 mr-2" />
        Página Inicial
      </div>
    </motion.div>
  )
}

export default BackToHomeButton