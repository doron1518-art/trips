'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { inviteMember } from '@/lib/actions/trips'
import { UserPlus, CheckCircle } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  tripId: string
}

export function InviteMemberModal({ open, onClose, tripId }: Props) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<{ error?: string; success?: boolean } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setState(null)
    const result = await inviteMember(tripId, email.trim())
    setState(result)
    setLoading(false)
    if (result.success) setEmail('')
  }

  function handleClose() {
    setEmail('')
    setState(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Invite a collaborator" maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500">
          Enter the email address of the person you want to invite. They must already have a Trips account.
        </p>

        {state?.error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        {state?.success && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Invite sent successfully!
          </div>
        )}

        <Input
          label="Email address"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="collaborator@example.com"
        />

        <div className="flex gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
            Done
          </Button>
          <Button type="submit" className="flex-1" loading={loading}>
            <UserPlus className="w-4 h-4" />
            Invite
          </Button>
        </div>
      </form>
    </Modal>
  )
}
