import { Plane } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
          <Plane className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Trips</h1>
        <p className="text-sm text-gray-500">Plan together, travel better</p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
