import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import DashboardLayout from '../components/DashboardLayout'
import { History, Calendar, Search, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'

interface AttendanceRecord {
    marked_at: string
    students: {
        email: string
        name?: string
    }
}

interface GroupedAttendance {
    date: string
    records: AttendanceRecord[]
    isOpen: boolean
}

export default function AttendanceHistory() {
    const [groupedHistory, setGroupedHistory] = useState<GroupedAttendance[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchHistory()
    }, [])

    const fetchHistory = async () => {
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
                .order('marked_at', { ascending: false })

            if (error) {
                // Fallback for potential schema differences
                const { data: retryData, error: retryError } = await supabase
                    .from('attendance')
                    .select(`
                        marked_at,
                        students!fk_student (
                            email
                        )
                    `)
                    .order('marked_at', { ascending: false })

                if (retryError) throw retryError
                processRecords(retryData as any)
            } else {
                processRecords(data as any)
            }
        } catch (err: any) {
            console.error('Error fetching history:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const processRecords = (data: AttendanceRecord[]) => {
        const groups: { [key: string]: AttendanceRecord[] } = {}

        data.forEach(record => {
            const date = dayjs(record.marked_at).format('YYYY-MM-DD')
            if (!groups[date]) groups[date] = []
            groups[date].push(record)
        })

        const sortedGroups = Object.keys(groups).sort((a, b) => dayjs(b).diff(dayjs(a))).map((date, index) => ({
            date,
            records: groups[date],
            isOpen: index === 0 // Open the most recent day by default
        }))

        setGroupedHistory(sortedGroups)
    }

    const toggleGroup = (date: string) => {
        setGroupedHistory(prev => prev.map(group =>
            group.date === date ? { ...group, isOpen: !group.isOpen } : group
        ))
    }

    const filteredHistory = groupedHistory.map(group => ({
        ...group,
        records: group.records.filter(record =>
            record.students?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.students?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(group => group.records.length > 0)

    return (
        <DashboardLayout>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Attendance History</h1>
                    <p className="text-slate-500 flex items-center">
                        <History size={16} className="mr-2" />
                        View and manage past attendance records
                    </p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search student history..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-80 bg-white shadow-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center text-slate-500">
                    <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                    Loading history...
                </div>
            ) : error ? (
                <div className="p-12 text-center text-red-500 bg-red-50 rounded-xl border border-red-100 italic">
                    Error loading history: {error}
                </div>
            ) : filteredHistory.length === 0 ? (
                <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-100">
                    {searchTerm ? 'No history found matching your search.' : 'No attendance history records yet.'}
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredHistory.map((group) => (
                        <div key={group.date} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <button
                                onClick={() => toggleGroup(group.date)}
                                className="w-full flex items-center justify-between p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                        <Calendar size={20} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-bold text-slate-900">
                                            {dayjs(group.date).format('MMMM D, YYYY')}
                                        </h3>
                                        <p className="text-sm text-slate-500">
                                            {group.records.length} students marked present
                                        </p>
                                    </div>
                                </div>
                                {group.isOpen ? <ChevronDown className="text-slate-400" /> : <ChevronRight className="text-slate-400" />}
                            </button>

                            {group.isOpen && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                <th className="py-4 px-8 font-semibold text-slate-600 text-sm">Student</th>
                                                <th className="py-4 px-8 font-semibold text-slate-600 text-sm">Status</th>
                                                <th className="py-4 px-8 font-semibold text-slate-600 text-sm">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.records.map((record, idx) => (
                                                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                                                    <td className="py-4 px-8">
                                                        <div className="flex items-center">
                                                            <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold mr-3 text-xs">
                                                                {(record.students?.name?.[0] || record.students?.email?.[0] || '?').toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-slate-900 text-sm">{record.students?.name || 'Anonymous'}</div>
                                                                <div className="text-xs text-slate-500">{record.students?.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-8">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                                                            Present
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-8 text-slate-500 font-medium text-sm">
                                                        <div className="flex items-center">
                                                            <Clock size={12} className="mr-1.5 text-slate-400" />
                                                            {dayjs(record.marked_at).format('h:mm A')}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    )
}
