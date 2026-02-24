import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    History,
    LogOut,
    ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Total Students', path: '/total-students', icon: Users },
    { name: 'Today\'s Attendance', path: '/attendance', icon: CalendarCheck },
    { name: 'Attendance History', path: '/history', icon: History },
];

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('auth_bypass');
        navigate('/login');
    };

    return (
        <div className="w-64 h-full flex-shrink-0 gradient-bg text-white flex flex-col shadow-xl m-0 p-0">
            <div className="p-6">
                <h1 className="text-2xl font-bold tracking-tight mb-8">QR Attendance</h1>

                <nav className="space-y-2 flex-grow">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.name}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                    ? 'bg-white/20 shadow-inner'
                                    : 'hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <Icon size={20} className={isActive ? 'text-white' : 'text-white/70 group-hover:text-white'} />
                                    <span className={`font-medium ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                                        {item.name}
                                    </span>
                                </div>
                                {isActive && <ChevronRight size={16} className="text-white" />}
                            </button>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-6">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
}
