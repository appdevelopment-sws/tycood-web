import { useState, useCallback } from "react"

export function useDisclosure<T = any>(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState)
  const [data, setData] = useState<T | null>(null)

  const onOpen = useCallback((data?: T | null) => {
    setData(data ?? null)
    setIsOpen(true)
  }, [])

  const onClose = useCallback(() => {
    setIsOpen(false)
    setData(null)
  }, [])

  const onToggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  return {
    isOpen,
    data,
    onOpen,
    onClose,
    onToggle,
  }
}

export default useDisclosure
