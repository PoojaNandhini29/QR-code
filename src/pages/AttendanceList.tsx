
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

interface AttendanceRecord {
    marked_at: string
    students: {
        email: string
        name?: string // Optional, as we are not sure if it exists
    }
}

export default function AttendanceList() {
    const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()

    useEffect(() => {
        fetchAttendance()
    }, [])

    const fetchAttendance = async () => {
        const startOfDay = dayjs().startOf('day').toISOString()
        const endOfDay = dayjs().endOf('day').toISOString()

        try {
            const { data, error } = await supabase
                .from('attendance')
                .select(`
                    marked_at,
                    students!fk_student (
                        email,
                        name
                    )
                `)
                .gte('marked_at', startOfDay)
                .lte('marked_at', endOfDay)
                .order('marked_at', { ascending: false })

            if (error) {
                // Fallback if 'name' column doesn't exist or other error
                if (error.code === 'PGRST100') { // Column not found error potential code, but difficult to catch specific column error this way without trying separate queries. 
                    // Let's rely on loose typing or just email if name fails? 
                    // Actually, let's just try fetching with email first if this fails?
                    // Re-trying with just email:
                    const { data: retryData, error: retryError } = await supabase
                        .from('attendance')
                        .select(`
                            marked_at,
                            students!fk_student (
                                email
                            )
                        `)
                        .gte('marked_at', startOfDay)
                        .lte('marked_at', endOfDay)
                        .order('marked_at', { ascending: false })

                    if (retryError) throw retryError
                    setAttendanceList(retryData as unknown as AttendanceRecord[])
                } else {
                    throw error
                }
            } else {
                setAttendanceList(data as unknown as AttendanceRecord[])
            }
        } catch (err: any) {
            console.error('Error fetching attendance:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-8 text-center">Loading attendance list...</div>
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-50 p-4">
            <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Today's Attendance</h2>
                    <span className="text-gray-500">{dayjs().format('MMMM D, YYYY')}</span>
                </div>

                {attendanceList.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No attendance marked for today yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="py-3 px-4 font-semibold text-gray-700">Student Email</th>
                                    <th className="py-3 px-4 font-semibold text-gray-700">Student Name</th>
                                    <th className="py-3 px-4 font-semibold text-gray-700">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceList.map((record, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4">{record.students?.email || 'N/A'}</td>
                                        <td className="py-3 px-4">{record.students?.name || '-'}</td>
                                        <td className="py-3 px-4 text-gray-500">
                                            {dayjs(record.marked_at).format('h:mm A')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-8 flex justify-center">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    )
}
