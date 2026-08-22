import { useEffect, useRef, useState } from 'react'

/**
 * Reveals an element with a fade + rise transition when it scrolls into view.
 * Returns a ref to attach to the element and a boolean for whether it's visible.
 */
export default function useReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            io.unobserve(entry.target)
          }
        })
      },
      { threshold }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [threshold])

  return [ref, visible]
}
