'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const router = useRouter()
    const supabase = createClientComponentClient()

    const handleSignUp = async () => {
        await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
            },
        })
        router.refresh()
        setEmail('')
        setPassword('')
    }

    const handleSignIn = async () => {
        await supabase.auth.signInWithPassword({
            email,
            password,
        })
        router.refresh()
        setEmail('')
        setPassword('')
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
    }

    return (
        <main className="h-screen rounded-br-sm flex item-center justify-center p-6">
            <div className="border rounded-lg p-8 shadow-lg bg-auto" >
            <input
                type="email"
                name="email"
                placeholder="email"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
            className="rounded mb-4 w-full p-3 border placeholder-gray-500 focus:outline-none focus:border-blue-500"/>
            <input
                type="password"
                name="password"
                placeholder="password"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                className="rounded mb-4 w-full p-3 border placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <button onClick={handleSignUp}
            className="rounded w-full mb-2 p-3 hover:bg-blue-200 focus:outline=none">sign up</button>
            <button onClick={handleSignIn}
                    className="rounded w-full mb-2 p-3 hover:bg-blue-200 focus:outline=none">sign in</button>
            <button onClick={handleSignOut}
            className="rounded w-full mb-2 p-3 hover:bg-blue-200 focus:outline=none">sign out</button>
            </div>
        </main>
    )
}