import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import dayjs from 'dayjs'
import DashboardLayout from '../components/DashboardLayout'
import { Calendar, Clock, Search, CheckCircle2, XCircle } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Student {
    id: string
    email: string
    name?: string
}

interface AttendanceRecord {
    marked_at: string
    student_id: string
    students: {
        id: string
        email: string
        name?: string
    }
}

type TabType = 'present' | 'absent'

export default function AttendanceList() {
    const [allStudents, setAllStudents] = useState<Student[]>([])
    const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState<TabType>('present')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            // Fetch all students
            const { data: studentsData, error: studentsError } = await supabase
                .from('students')
                .select('id, email, name')
                .order('name', { ascending: true })

            if (studentsError) throw studentsError
            setAllStudents(studentsData || [])

            // Fetch today's attendance
            const startOfDay = dayjs().startOf('day').toISOString()
            const endOfDay = dayjs().endOf('day').toISOString()

            const { data: attendanceData, error: attendanceError } = await supabase
                .from('attendance')
                .select(`
                    marked_at,
                    student_id,
                    students!fk_student (
                        id,
                        email,
                        name
                    )
                `)
                .gte('marked_at', startOfDay)
                .lte('marked_at', endOfDay)
                .order('marked_at', { ascending: false })

            if (attendanceError) {
                // Fallback without fk_student hint
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('attendance')
                    .select(`marked_at, student_id, students(id, email, name)`)
                    .gte('marked_at', startOfDay)
                    .lte('marked_at', endOfDay)
                    .order('marked_at', { ascending: false })
                if (fallbackError) throw fallbackError
                setAttendanceList(fallbackData as unknown as AttendanceRecord[] || [])
            } else {
                setAttendanceList(attendanceData as unknown as AttendanceRecord[] || [])
            }
        } catch (err: any) {
            console.error('Error fetching data:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Build a set of present student IDs for O(1) lookup
    const presentStudentIds = new Set(attendanceList.map(r => r.student_id || r.students?.id))

    // Present students (from attendance records)
    const presentStudents = attendanceList.filter(record => {
        const name = record.students?.name || ''
        const email = record.students?.email || ''
        return (
            name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })

    // Absent students (all students not in attendance today)
    const absentStudents = allStudents.filter(student => {
        const isAbsent = !presentStudentIds.has(student.id)
        const matchSearch = (
            (student.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
        return isAbsent && matchSearch
    })

    const tabs: { key: TabType; label: string; count: number; color: string }[] = [
        { key: 'present', label: 'Present', count: presentStudents.length, color: 'emerald' },
        { key: 'absent', label: 'Absent', count: absentStudents.length, color: 'rose' },
    ]

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Today's Attendance</h1>
                    <p className="text-slate-500 flex items-center">
                        <Calendar size={16} className="mr-2" />
                        {dayjs().format('MMMM D, YYYY')}
                    </p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-72 bg-white shadow-sm"
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100">
                    <div className="flex items-center mb-1">
                        <CheckCircle2 size={18} className="text-emerald-500 mr-2" />
                        <span className="text-slate-500 text-sm font-medium">Present Today</span>
                    </div>
                    <div className="text-3xl font-black text-emerald-600">{presentStudents.length}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-rose-100">
                    <div className="flex items-center mb-1">
                        <XCircle size={18} className="text-rose-500 mr-2" />
                        <span className="text-slate-500 text-sm font-medium">Absent Today</span>
                    </div>
                    <div className="text-3xl font-black text-rose-600">{absentStudents.length}</div>
                </div>
            </div>

            {/* Pie Chart */}
            {!loading && !error && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Attendance Overview</h2>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="w-full md:w-64 h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Present', value: presentStudents.length || 0 },
                                            { name: 'Absent', value: absentStudents.length || 0 },
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={90}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        <Cell fill="#10b981" />
                                        <Cell fill="#f43f5e" />
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                                        formatter={(value, name) => [`${value ?? 0} students`, name]}
                                    />
                                    <Legend
                                        iconType="circle"
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-col gap-4 flex-1">
                            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                <div className="w-4 h-4 rounded-full bg-emerald-500 flex-shrink-0" />
                                <div>
                                    <div className="text-sm font-medium text-slate-500">Present</div>
                                    <div className="text-2xl font-black text-emerald-600">{presentStudents.length}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-xl border border-rose-100">
                                <div className="w-4 h-4 rounded-full bg-rose-500 flex-shrink-0" />
                                <div>
                                    <div className="text-sm font-medium text-slate-500">Absent</div>
                                    <div className="text-2xl font-black text-rose-600">{absentStudents.length}</div>
                                </div>
                            </div>
                            {(presentStudents.length + absentStudents.length) > 0 && (
                                <div className="text-xs text-slate-400">
                                    Attendance rate: <span className="font-bold text-indigo-600">
                                        {Math.round((presentStudents.length / (presentStudents.length + absentStudents.length)) * 100)}%
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex space-x-2 mb-6 border-b border-slate-100">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 -mb-px ${activeTab === tab.key
                            ? tab.color === 'emerald'
                                ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                                : 'border-rose-500 text-rose-700 bg-rose-50'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        {tab.key === 'present'
                            ? <CheckCircle2 size={16} />
                            : <XCircle size={16} />
                        }
                        {tab.label}
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeTab === tab.key
                            ? tab.color === 'emerald' ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                            : 'bg-slate-100 text-slate-500'
                            }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
                        Loading attendance data...
                    </div>
                ) : error ? (
                    <div className="p-12 text-center text-red-500 bg-red-50 m-4 rounded-xl border border-red-100">
                        Error: {error}
                    </div>
                ) : activeTab === 'present' ? (
                    presentStudents.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            {searchTerm ? 'No present students match your search.' : 'No attendance marked for today yet.'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-emerald-50/50 border-b border-slate-100">
                                        <th className="py-4 px-6 font-semibold text-slate-600">Student</th>
                                        <th className="py-4 px-6 font-semibold text-slate-600">Status</th>
                                        <th className="py-4 px-6 font-semibold text-slate-600">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {presentStudents.map((record, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 hover:bg-emerald-50/20 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white font-bold mr-3 shadow-sm group-hover:scale-105 transition-transform">
                                                        {(record.students?.name?.[0] || record.students?.email?.[0] || '?').toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900">{record.students?.name || 'Unknown'}</div>
                                                        <div className="text-xs text-slate-500">{record.students?.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                                    <CheckCircle2 size={12} /> Present
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-slate-500 text-sm font-medium">
                                                <div className="flex items-center">
                                                    <Clock size={13} className="mr-1.5 text-slate-400" />
                                                    {dayjs(record.marked_at).format('h:mm A')}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    absentStudents.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            {searchTerm ? 'No absent students match your search.' : 'All students are present today! 🎉'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-rose-50/50 border-b border-slate-100">
                                        <th className="py-4 px-6 font-semibold text-slate-600">Student</th>
                                        <th className="py-4 px-6 font-semibold text-slate-600">Status</th>
                                        <th className="py-4 px-6 font-semibold text-slate-600">Registered</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {absentStudents.map((student, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 hover:bg-rose-50/20 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold mr-3 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">
                                                        {(student.name?.[0] || student.email?.[0] || '?').toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-700">{student.name || 'Unknown'}</div>
                                                        <div className="text-xs text-slate-500">{student.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                                                    <XCircle size={12} /> Absent
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-slate-400 text-xs">
                                                —
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>
        </DashboardLayout>
    )
}
