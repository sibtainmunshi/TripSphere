import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface ChatBubbleProps {
  from: 'user' | 'ai'
  children: ReactNode
}

export function ChatBubble({ from, children }: ChatBubbleProps) {
  const isUser = from === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-sm bg-brand text-white'
            : 'rounded-bl-sm bg-neutral-100 text-neutral-800'
        }`}
      >
        {children}
      </div>
    </motion.div>
  )
}
