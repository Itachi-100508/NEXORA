import { motion } from 'framer-motion'
import { GraduationCap } from 'lucide-react'
import { APP_CONFIG } from '../constants/config'

export default function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div className="auth-visual-inner">
          <motion.div
            className="auth-brand"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="auth-logo">
              <GraduationCap size={30} />
            </div>
            <div>
              <div className="auth-name">{APP_CONFIG.name}</div>
              <div className="auth-tag">Digital Result Management</div>
            </div>
          </motion.div>

          <motion.h1
            className="auth-headline"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            Centralized Examination
            <br />
            Result Management
          </motion.h1>

          <motion.p
            className="auth-subhead"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
          >
            Seamlessly manage exams, marks, approvals and student results — all in one
            modern academic platform.
          </motion.p>

          <motion.div
            className="auth-features"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {[
              { emoji: '📚', text: 'Exam lifecycle management' },
              { emoji: '✍️', text: 'Teacher marks entry & validation' },
              { emoji: '✅', text: 'Admin approval & publication' },
              { emoji: '📊', text: 'Reports and analytics' },
            ].map((f) => (
              <div className="auth-feature" key={f.text}>
                <span className="auth-feature-emoji">{f.emoji}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="auth-form-col">
        <motion.div
          className="auth-form-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}
