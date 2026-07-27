import { useEffect, useState } from 'react'
import { animate } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  prefix?: string
}

export function AnimatedNumber({ value, prefix = '' }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    })
    return () => controls.stop()
  }, [value])

  return (
    <>
      {prefix}
      {display.toLocaleString('en-IN')}
    </>
  )
}
