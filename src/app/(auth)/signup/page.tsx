'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUp } from '@/lib/actions/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signUp, null)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Create your account</h2>
      <p className="text-sm text-gray-500 mb-6">Start planning your next trip</p>

      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        <Input label="Full name" name="full_name" type="text" autoComplete="name" required placeholder="Jane Smith" />
        <Input label="Email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="At least 8 characters"
          minLength={8}
        />

        <Button type="submit" className="w-full" size="lg" loading={isPending}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
          Sign in
        </Link>
      </p>
    </div>
  )
}
