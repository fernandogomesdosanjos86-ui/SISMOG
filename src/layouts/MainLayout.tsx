import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Menu } from 'lucide-react';

const MainLayout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                {/* Mobile Header */}
                <div className="md:hidden bg-blue-900 text-white p-4 flex items-center justify-between shadow-md sticky top-0 z-30 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="SISMOG" className="h-8 w-8 object-contain" />
                        <span className="font-bold text-lg tracking-wide">SISMOG</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                </div>

                {/* Content Area */}
                <main className="flex-1 p-3 md:p-6 w-full max-w-[1600px] mx-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
