'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => Promise<void> | void
}

export function ConfirmModal({ open, onClose, title, message, confirmLabel = 'Delete', onConfirm }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    await onConfirm()
    setLoading(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="">
      <div className="flex flex-col items-center text-center gap-4 pb-2">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 w-full mt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" variant="danger" className="flex-1" loading={loading} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
