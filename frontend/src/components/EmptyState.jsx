import { motion } from 'framer-motion'
import { Inbox } from 'lucide-react'

export default function EmptyState({ 
  title = 'No data found', 
  message = 'There are no items to display.',
  icon: Icon = Inbox 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="w-16 h-16 rounded-full bg-ipl-navy/50 flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-gray-500" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-center max-w-md">{message}</p>
    </motion.div>
  )
}

