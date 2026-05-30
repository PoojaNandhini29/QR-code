
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import dayjs from 'dayjs'

export default function Scan() {
    const [searchParams] = useSearchParams()
    const sessionCode = searchParams.get('session_code')

    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<'loading' | 'valid' | 'expired' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('Verifying code...')

    useEffect(() => {
        if (!sessionCode) {
            setStatus('error')
            setMessage('Invalid QR Code')
            return
        }

        checkSessionValidity()
    }, [sessionCode])

    const checkSessionValidity = async () => {
        const { data, error } = await supabase
            .from('attendance_sessions')
            .select('*')
            .eq('id', sessionCode)
            .single()

        if (error || !data) {
            setStatus('error')
            setMessage('Session not found')
            return
        }

        if (dayjs().isAfter(dayjs(data.expires_at))) {
            setStatus('expired')
            setMessage('This QR code has expired.')
        } else {
            setStatus('valid')
            setMessage('')
        }
    }

    const handleMarkAttendance = async (e: React.FormEvent) => {
        e.preventDefault()
        if (status !== 'valid') return

        // Verify student exists
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('id')
            .eq('email', email)
            .single()

        if (studentError || !student) {
            alert('Student not found with this email.')
            return
        }

        // Mark attendance
        const { error: attendanceError } = await supabase
            .from('attendance')
            .insert([{ session_id: sessionCode, student_id: student.id, marked_at: new Date().toISOString() }])

        if (attendanceError) {
            if (attendanceError.code === '23505') { // Unique constraint violation code
                alert('Attendance already marked for this session.')
                setStatus('success')
                setMessage('Attendance already marked.')
            } else {
                alert('Error marking attendance: ' + attendanceError.message)
            }
        } else {
            setStatus('success')
            setMessage('Attendance marked successfully!')
        }
    }

    if (status === 'loading') return <div className="p-8 text-center">Verifying code...</div>
    if (status === 'error') return <div className="p-8 text-center text-red-500">{message}</div>
    if (status === 'expired') return <div className="p-8 text-center text-orange-500">{message}</div>
    if (status === 'success') return <div className="p-8 text-center text-green-500 text-xl font-bold">{message}</div>

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Mark Attendance</h2>
                <form onSubmit={handleMarkAttendance}>
                    <input
                        type="email"
                        placeholder="Enter your student email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 mb-4 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                    />
                    <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition"
                    >
                        Submit Attendance
                    </button>
                </form>
            </div>
        </div>
    )
}
