import { Link, useLocation } from "react-router";
import { MessageCircle, Home, Settings, Brain, ListTodo, PanelLeft, MoreVertical, Keyboard } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface NavbarProps {
  onShowShortcuts?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function Navbar({ onShowShortcuts, onToggleSidebar, isSidebarOpen }: Readonly<NavbarProps>) {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;
  const isChatPage = location.pathname === "/chat";

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl">
      <div className="w-full px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo + Sidebar Toggle */}
          <div className="flex items-center gap-3">
            {isChatPage && onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}
            
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-purple-500 to-cyan-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-linear-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent hidden sm:block">Chatbot</span>
            </Link>
          </div>

          {/* Center: Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            <NavLink to="/" icon={<Home className="w-4 h-4" />} active={isActive("/")}>Home</NavLink>
            <NavLink to="/chat" icon={<MessageCircle className="w-4 h-4" />} active={isActive("/chat")}>Chat</NavLink>
            <NavLink to="/memory" icon={<Brain className="w-4 h-4" />} active={isActive("/memory")}>Memory</NavLink>
            <NavLink to="/tasks" icon={<ListTodo className="w-4 h-4" />} active={isActive("/tasks")}>Tasks</NavLink>
          </div>

          {/* Right: Actions Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Menu"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-xl py-2 animate-fade-in">
                {/* Mobile Navigation Links */}
                <div className="lg:hidden">
                  <MenuItem
                    icon={<Home className="w-4 h-4" />}
                    onClick={() => {
                      window.location.href = '/';
                      setIsMenuOpen(false);
                    }}
                  >
                    Home
                  </MenuItem>
                  <MenuItem
                    icon={<MessageCircle className="w-4 h-4" />}
                    onClick={() => {
                      window.location.href = '/chat';
                      setIsMenuOpen(false);
                    }}
                  >
                    Chat
                  </MenuItem>
                  <MenuItem
                    icon={<Brain className="w-4 h-4" />}
                    onClick={() => {
                      window.location.href = '/memory';
                      setIsMenuOpen(false);
                    }}
                  >
                    Memory
                  </MenuItem>
                  <MenuItem
                    icon={<ListTodo className="w-4 h-4" />}
                    onClick={() => {
                      window.location.href = '/tasks';
                      setIsMenuOpen(false);
                    }}
                  >
                    Tasks
                  </MenuItem>
                  <div className="border-t border-white/10 my-2" />
                </div>
                
                <MenuItem
                  icon={<Settings className="w-4 h-4" />}
                  onClick={() => {
                    window.location.href = '/settings';
                    setIsMenuOpen(false);
                  }}
                >
                  Settings
                </MenuItem>
                {onShowShortcuts && (
                  <MenuItem
                    icon={<Keyboard className="w-4 h-4" />}
                    onClick={() => {
                      onShowShortcuts();
                      setIsMenuOpen(false);
                    }}
                  >
                    Shortcuts
                  </MenuItem>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  active: boolean;
  children: React.ReactNode;
}

function NavLink({ to, icon, active, children }: Readonly<NavLinkProps>) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${
        active
          ? "bg-white/10 text-white font-medium"
          : "text-gray-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}

function MenuItem({ icon, onClick, children }: Readonly<MenuItemProps>) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

interface MobileNavLinkProps extends NavLinkProps {
  onClick: () => void;
}

function MobileNavLink({ to, icon, active, children, onClick }: Readonly<MobileNavLinkProps>) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
        active
          ? "bg-linear-to-r from-purple-500 to-cyan-500 text-white shadow-lg"
          : "text-gray-300 hover:text-white hover:bg-white/10"
      }`}
    >
      {icon}
      <span className="font-medium">{children}</span>
    </Link>
  );
}
