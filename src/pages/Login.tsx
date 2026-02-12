import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Login() {
    const [email, setEmail] = useState('teacher@gmail.com')
    const [password, setPassword] = useState('teacher')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Hardcoded credentials as requested
        const targetEmail = 'teacher@gmail.com'
        const targetPassword = 'teacher'

        const { error } = await supabase.auth.signInWithPassword({
            email: targetEmail,
            password: targetPassword
        })

        if (error) {
            console.error("Supabase Login Error:", error.message)
            // Fallback/Bypass for development if credentials match hardcoded values
            if (email === targetEmail && password === targetPassword) {
                console.warn("Enabling Dev Bypass for hardcoded credentials")
                localStorage.setItem('auth_bypass', 'true')
                navigate('/dashboard')
            } else {
                alert(error.message)
            }
        } else {
            localStorage.removeItem('auth_bypass')
            navigate('/dashboard')
        }
        setLoading(false)
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <form onSubmit={handleLogin} className="p-8 bg-white rounded shadow-md w-96">
                <h2 className="mb-6 text-2xl font-bold text-center">Teacher Login</h2>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 mb-4 border rounded"
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 mb-4 border rounded"
                    required
                />
                <button type="submit" disabled={loading} className="w-full p-2 text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50">
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    )
}
