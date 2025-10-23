import { Link, useLocation } from "react-router";
import { MessageCircle, Home, Menu, X, Keyboard, Settings } from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  onShowShortcuts?: () => void;
}

export function Navbar({ onShowShortcuts }: Readonly<NavbarProps>) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/50 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">RAG Chatbot</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink to="/" icon={<Home className="w-5 h-5" />} active={isActive("/")}>
              Home
            </NavLink>
            <NavLink to="/chat" icon={<MessageCircle className="w-5 h-5" />} active={isActive("/chat")}>
              Chat
            </NavLink>
            <NavLink to="/settings" icon={<Settings className="w-5 h-5" />} active={isActive("/settings")}>
              Settings
            </NavLink>
            {onShowShortcuts && (
              <button
                onClick={onShowShortcuts}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-all text-sm"
                title="Keyboard shortcuts (Ctrl + /)"
              >
                <Keyboard className="w-4 h-4" />
                <span>Shortcuts</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg glass hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass-card m-4 animate-fade-in">
          <div className="flex flex-col space-y-2">
            <MobileNavLink 
              to="/" 
              icon={<Home className="w-5 h-5" />} 
              active={isActive("/")}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </MobileNavLink>
            <MobileNavLink 
              to="/chat" 
              icon={<MessageCircle className="w-5 h-5" />} 
              active={isActive("/chat")}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Chat
            </MobileNavLink>
            <MobileNavLink 
              to="/settings" 
              icon={<Settings className="w-5 h-5" />} 
              active={isActive("/settings")}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Settings
            </MobileNavLink>
          </div>
        </div>
      )}
    </nav>
  );
}

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  active: boolean;
  children: React.ReactNode;
}

function NavLink({ to, icon, active, children }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
        active
          ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg shadow-purple-500/50"
          : "text-gray-300 hover:text-white hover:bg-white/10"
      }`}
    >
      {icon}
      <span className="font-medium">{children}</span>
    </Link>
  );
}

interface MobileNavLinkProps extends NavLinkProps {
  onClick: () => void;
}

function MobileNavLink({ to, icon, active, children, onClick }: MobileNavLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
        active
          ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg"
          : "text-gray-300 hover:text-white hover:bg-white/10"
      }`}
    >
      {icon}
      <span className="font-medium">{children}</span>
    </Link>
  );
}
