import { useCallback, useState } from 'react'

export function useModalState(initialModal = null) {
  const [modal, setModal] = useState(initialModal)
  const closeModal = useCallback(() => setModal(null), [])

  return { modal, setModal, closeModal }
}
