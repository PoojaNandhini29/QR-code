import { useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { supabase } from '../lib/supabaseClient'
import dayjs from 'dayjs'

export default function Dashboard() {
    const [qrValue, setQrValue] = useState('')
    const [loading, setLoading] = useState(false)

    const generateQRCode = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        // Use real user ID if available, otherwise mock ID for bypass mode
        const userId = user?.id || '00000000-0000-0000-0000-000000000000'

        const expiresAt = dayjs().add(10, 'minute').toISOString()

        const { data, error } = await supabase
            .from('attendance_sessions')
            .insert([{ created_by: userId, expires_at: expiresAt }])
            .select()
            .single()

        if (error) {
            console.error('Error creating session:', error)
            alert('Error generating QR code')
        } else {
            const sessionUrl = `${window.location.origin}/scan?session_code=${data.id}`
            setQrValue(sessionUrl)
        }
        setLoading(false)
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <h1 className="text-3xl font-bold mb-8">Attendance Dashboard</h1>

            {window.location.hostname === 'localhost' && (
                <div className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-300 max-w-md text-center">
                    <strong>⚠️ Mobile Scanning Warning</strong>
                    <p className="mt-2 text-sm">
                        You are on <code>localhost</code>. If you generate a QR code now, your phone <strong>will not</strong> be able to open it.
                    </p>
                    <p className="mt-2 text-sm">
                        Please change the URL in your browser address bar to your computer's Network IP (e.g., <code>192.168.x.x:5173</code>) <strong>before</strong> generating the code.
                    </p>
                    <p className="mt-2 text-xs text-gray-600">
                        Check your terminal where `npm run dev` is running to find the Network URL.
                    </p>
                </div>
            )}

            <button
                onClick={generateQRCode}
                disabled={loading}
                className="px-6 py-3 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition disabled:opacity-50"
            >
                {loading ? 'Generating...' : 'Generate New QR Code'}
            </button>

            {qrValue && (
                <div className="mt-8 p-6 bg-white rounded-lg shadow-xl flex flex-col items-center">
                    <QRCodeCanvas value={qrValue} size={256} />
                    <p className="mt-4 text-sm text-gray-500">Valid for 10 minutes</p>
                </div>
            )}
        </div>
    )
}
