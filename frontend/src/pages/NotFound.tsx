import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <Link to="/" className="text-neutral-500 underline">
        Back home
      </Link>
    </main>
  )
}
