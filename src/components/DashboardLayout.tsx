import React from 'react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="flex h-screen w-screen overflow-hidden m-0 p-0 bg-slate-50">
            <Sidebar />
            <main className="flex-1 h-full overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
