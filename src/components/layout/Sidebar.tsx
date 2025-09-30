import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  Home, 
  BarChart3, 
  MessageSquare, 
  Settings,
  Zap,
  Sparkles,
  Mail,
  BookOpen,
  Clock,
  Menu,
  X
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, color: 'from-blue-500 to-purple-600' },
  { name: 'SMS', href: '/sms', icon: MessageSquare, color: 'from-cyan-500 to-blue-600' },
  { name: 'Schedule SMS', href: '/schedule-sms', icon: Clock, color: 'from-teal-500 to-emerald-600' },
  { name: 'Email', href: '/email', icon: Mail, color: 'from-orange-500 to-red-600' },
  { name: 'Email Templates', href: '/email-templates', icon: Mail, color: 'from-red-500 to-pink-600' },
  { name: 'Schedule Email', href: '/schedule-email', icon: Clock, color: 'from-teal-500 to-emerald-600' },
  { name: 'API Docs', href: '/api-docs', icon: BookOpen, color: 'from-green-500 to-emerald-600' },
  { name: 'Settings', href: '/settings', icon: Settings, color: 'from-gray-500 to-slate-600' },
];

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  
  // Handle mounting to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      {/* Mobile menu button - shown only on small screens */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-full bg-gradient-to-r from-slate-900 to-emerald-900 text-white shadow-lg"
        >
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-b from-slate-900/95 via-teal-900/95 to-emerald-900/95 backdrop-blur-xl border-r border-white/10 px-6 pb-4">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-b from-slate-900/95 via-teal-900/95 to-emerald-900/95 backdrop-blur-xl border-r border-white/10 px-6 pb-4">
        {/* Logo/Brand */}
        <div className="flex h-20 shrink-0 items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                PossiNote
              </h1>
              <p className="text-xs text-gray-400">API Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <div className="text-xs font-semibold leading-6 text-gray-400 mb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Navigation</span>
                </div>
              </div>
              <ul role="list" className="space-y-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`
                          group flex gap-x-3 rounded-2xl p-3 text-sm leading-6 font-medium transition-all duration-300
                          ${isActive 
                            ? `bg-gradient-to-r ${item.color} text-white shadow-lg shadow-blue-500/25` 
                            : 'text-gray-300 hover:text-white hover:bg-white/5 hover:backdrop-blur-sm'
                          }
                        `}
                      >
                        <div className={`
                          p-2 rounded-xl transition-all duration-300
                          ${isActive 
                            ? 'bg-white/20' 
                            : 'bg-gray-500/20 group-hover:bg-white/10'
                          }
                        `}>
                          <item.icon className="h-5 w-5 shrink-0" />
                        </div>
                        <span className="font-medium">{item.name}</span>
                        {isActive && (
                          <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          </ul>

          {/* Bottom Section */}
          <div className="mt-auto pt-6 border-t border-white/10">
            <div className="p-4 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-2xl border border-white/10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 rounded-xl">
                  <Sparkles className="h-4 w-4 text-teal-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Pro Dashboard</p>
                  <p className="text-xs text-gray-400">Full access enabled</p>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
      </div>
      </div>

      {/* Mobile sidebar - conditionally shown */}
      {isMounted && (
        <div 
          className={`fixed inset-0 z-40 transform transition-transform duration-300 ease-in-out lg:hidden ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)}></div>
          <div className="relative flex flex-col w-72 max-w-[80vw] h-full overflow-y-auto bg-gradient-to-b from-slate-900/95 via-teal-900/95 to-emerald-900/95 backdrop-blur-xl border-r border-white/10 px-6 pb-4">
            {/* Logo/Brand */}
            <div className="flex h-20 shrink-0 items-center">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    PossiNote
                  </h1>
                  <p className="text-xs text-gray-400">API Dashboard</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <div className="text-xs font-semibold leading-6 text-gray-400 mb-3">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-4 w-4" />
                      <span>Navigation</span>
                    </div>
                  </div>
                  <ul role="list" className="space-y-2">
                    {navigation.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className={`
                              group flex gap-x-3 rounded-2xl p-3 text-sm leading-6 font-medium transition-all duration-300
                              ${isActive 
                                ? `bg-gradient-to-r ${item.color} text-white shadow-lg shadow-blue-500/25` 
                                : 'text-gray-300 hover:text-white hover:bg-white/5 hover:backdrop-blur-sm'
                              }
                            `}
                            onClick={() => setIsMobileOpen(false)}
                          >
                            <div className={`
                              p-2 rounded-xl transition-all duration-300
                              ${isActive 
                                ? 'bg-white/20' 
                                : 'bg-gray-500/20 group-hover:bg-white/10'
                              }
                            `}>
                              <item.icon className="h-5 w-5 shrink-0" />
                            </div>
                            <span className="font-medium">{item.name}</span>
                            {isActive && (
                              <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              </ul>

              {/* Bottom Section */}
              <div className="mt-auto pt-6 border-t border-white/10">
                <div className="p-4 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-2xl border border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 rounded-xl">
                      <Sparkles className="h-4 w-4 text-teal-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Pro Dashboard</p>
                      <p className="text-xs text-gray-400">Full access enabled</p>
                    </div>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
} 