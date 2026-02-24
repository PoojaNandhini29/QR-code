import { useState, useEffect } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { supabase } from '../lib/supabaseClient'
import dayjs from 'dayjs'
import DashboardLayout from '../components/DashboardLayout'
import { QrCode, AlertTriangle, Clock } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
    const [qrValue, setQrValue] = useState('')
    const [loading, setLoading] = useState(false)
    const [studentCount, setStudentCount] = useState<number>(0)
    const [presentCount, setPresentCount] = useState<number>(0)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        // Total students
        const { count: total } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })

        setStudentCount(total || 0)

        // Today's present count
        const startOfDay = dayjs().startOf('day').toISOString()
        const endOfDay = dayjs().endOf('day').toISOString()

        const { count: present } = await supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true })
            .gte('marked_at', startOfDay)
            .lte('marked_at', endOfDay)

        setPresentCount(present || 0)
    }

    const absentCount = Math.max(0, studentCount - presentCount)

    const pieData = [
        { name: 'Present', value: presentCount },
        { name: 'Absent', value: absentCount },
    ]

    const generateQRCode = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
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
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to your Dashboard</h1>
                <p className="text-slate-500">Manage your attendance sessions and student information.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* QR Generation Card */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-100">
                        <QrCode size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Generate Attendance Code</h2>
                    <p className="text-slate-500 text-center mb-8 max-w-sm">
                        Generate a secure QR code for students to scan. The code will be valid for 10 minutes.
                    </p>

                    {window.location.hostname === 'localhost' && (
                        <div className="mb-8 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start space-x-3">
                            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                            <div className="text-sm text-amber-800">
                                <span className="font-semibold block mb-1">Localhost Warning</span>
                                Using <code className="bg-amber-100/50 px-1 rounded text-amber-900">localhost</code> will prevent mobile devices from scanning. Use your Network IP instead.
                            </div>
                        </div>
                    )}

                    <button
                        onClick={generateQRCode}
                        disabled={loading}
                        className="w-full py-4 gradient-bg text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:opacity-90 transition-all disabled:opacity-50 active:scale-[0.98]"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                Generating...
                            </div>
                        ) : 'Generate New QR Code'}
                    </button>

                    {qrValue && (
                        <div className="mt-8 p-8 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                            <div className="bg-white p-4 rounded-xl shadow-sm">
                                <QRCodeCanvas value={qrValue} size={200} />
                            </div>
                            <div className="mt-6 flex items-center text-indigo-600 font-semibold bg-indigo-50 px-4 py-2 rounded-full text-sm">
                                <Clock size={16} className="mr-2" />
                                Valid for 10 minutes
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Stats + Pie Chart */}
                <div className="flex flex-col gap-4">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div className="text-slate-500 text-sm font-medium mb-1">Total Students</div>
                            <div className="text-2xl font-black text-indigo-700">{studentCount}</div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div className="text-slate-500 text-sm font-medium mb-1">Active Sessions</div>
                            <div className="text-2xl font-black text-emerald-700">{qrValue ? '1' : '0'}</div>
                        </div>
                    </div>

                    {/* Pie Chart Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="text-lg font-bold text-slate-900 mb-1">Today's Attendance</h2>
                        <p className="text-xs text-slate-400 mb-4">{dayjs().format('MMMM D, YYYY')}</p>

                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={52}
                                        outerRadius={82}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        <Cell fill="#10b981" />
                                        <Cell fill="#f43f5e" />
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                                        formatter={(value, name) => [`${value} students`, name]}
                                    />
                                    <Legend iconType="circle" iconSize={10} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="flex gap-3 mt-2">
                            <div className="flex-1 flex items-center gap-2 bg-emerald-50 rounded-xl px-4 py-3">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                                <div>
                                    <div className="text-[11px] font-medium text-slate-500">Present</div>
                                    <div className="text-xl font-black text-emerald-600">{presentCount}</div>
                                </div>
                            </div>
                            <div className="flex-1 flex items-center gap-2 bg-rose-50 rounded-xl px-4 py-3">
                                <div className="w-3 h-3 rounded-full bg-rose-500 flex-shrink-0" />
                                <div>
                                    <div className="text-[11px] font-medium text-slate-500">Absent</div>
                                    <div className="text-xl font-black text-rose-600">{absentCount}</div>
                                </div>
                            </div>
                        </div>

                        {studentCount > 0 && (
                            <div className="text-xs text-slate-400 mt-3 text-center">
                                Attendance rate:{' '}
                                <span className="font-bold text-indigo-600">
                                    {Math.round((presentCount / studentCount) * 100)}%
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
