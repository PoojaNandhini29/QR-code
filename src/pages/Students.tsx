import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import DashboardLayout from '../components/DashboardLayout'
import { Users, Search, Mail, Calendar } from 'lucide-react'
import dayjs from 'dayjs'

interface Student {
    id: string
    email: string
    name: string
    created_at: string
}

export default function Students() {
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchStudents()
    }, [])

    const fetchStudents = async () => {
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .order('name', { ascending: true })

            if (error) throw error
            setStudents(data || [])
        } catch (err: any) {
            console.error('Error fetching students:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const filteredStudents = students.filter(student =>
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <DashboardLayout>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Total Students</h1>
                    <p className="text-slate-500 flex items-center">
                        <Users size={16} className="mr-2" />
                        Manage and view all registered students
                    </p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-80 bg-white shadow-sm transition-all"
                    />
                </div>
            </div>

            {/* Quick Stats */}
            <div className="mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 w-full md:w-64">
                    <div className="text-slate-500 text-sm font-medium mb-1">Total Registered</div>
                    <div className="text-3xl font-black text-indigo-600">{students.length}</div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
                        Loading students list...
                    </div>
                ) : error ? (
                    <div className="p-12 text-center text-red-500 bg-red-50 m-4 rounded-xl border border-red-100">
                        Error: {error}
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                            <Search size={32} />
                        </div>
                        {searchTerm ? 'No students found matching your search.' : 'No students found in the portal.'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="py-4 px-6 font-semibold text-slate-600">Student</th>
                                    <th className="py-4 px-6 font-semibold text-slate-600">Contact Info</th>
                                    <th className="py-4 px-6 font-semibold text-slate-600">Joined Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student) => (
                                    <tr key={student.id} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors group">
                                        <td className="py-5 px-6">
                                            <div className="flex items-center">
                                                <div className="w-11 h-11 rounded-xl gradient-bg flex items-center justify-center text-white font-bold mr-4 shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
                                                    {(student.name?.[0] || student.email?.[0] || '?').toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                        {student.name || 'Anonymous Student'}
                                                    </div>
                                                    <div className="text-xs text-slate-400 font-medium">ID: {student.id.slice(0, 8)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center text-slate-600">
                                                    <Mail size={14} className="mr-2 text-slate-400" />
                                                    {student.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex items-center text-slate-500 text-sm">
                                                <Calendar size={14} className="mr-2 text-slate-400" />
                                                {dayjs(student.created_at).format('MMM D, YYYY')}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
