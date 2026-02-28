"use client"

import { useState, FormEvent } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false
    })

    setLoading(false)

    if (result?.error) {
      setError("Invalid username or password.")
    } else {
      router.push("/")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-[#f0f0f0] tracking-tight">BJJ Scout</h1>
          <p className="mt-1 text-sm text-[#666666]">Private access only</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md p-6 space-y-4"
        >
          <div>
            <label className="block text-xs uppercase tracking-wider font-medium text-[#a0a0a0] mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-md px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#666] outline-none focus:border-[#444] transition-colors"
              placeholder="Username"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-medium text-[#a0a0a0] mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-md px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#666] outline-none focus:border-[#444] transition-colors"
              placeholder="Password"
            />
          </div>

          {error && (
            <p className="text-sm text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#e8e8e8] text-[#0a0a0a] font-medium px-4 py-2 rounded-md hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  )
}
