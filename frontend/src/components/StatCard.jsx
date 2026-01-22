import { motion } from 'framer-motion'

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  delay = 0,
  color = 'blue' 
}) {
  const colorClasses = {
    blue: 'from-ipl-blue/20 to-ipl-blue/5 border-ipl-blue/30',
    gold: 'from-ipl-gold/20 to-ipl-gold/5 border-ipl-gold/30',
    teal: 'from-teal-500/20 to-teal-500/5 border-teal-500/30',
    crimson: 'from-red-500/20 to-red-500/5 border-red-500/30',
    orange: 'from-orange-500/20 to-orange-500/5 border-orange-500/30'
  }

  const iconColorClasses = {
    blue: 'text-ipl-blue',
    gold: 'text-ipl-gold',
    teal: 'text-teal-400',
    crimson: 'text-red-400',
    orange: 'text-orange-400'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
      className={`stat-card relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorClasses[color]} border p-6`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white font-display tracking-wider">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-sm mt-2 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${iconColorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      
      {/* Decorative element */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-xl" />
    </motion.div>
  )
}

