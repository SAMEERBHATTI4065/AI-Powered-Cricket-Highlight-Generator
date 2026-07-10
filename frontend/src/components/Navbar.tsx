import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Zap, Menu, X, LogIn, LogOut, Bell, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Analyse", path: "/dashboard" },
    { name: "Results", path: "/results" },
    { name: "History", path: "/history" },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${isScrolled ? "py-4 bg-background/80 backdrop-blur-xl border-b border-border/50" : "py-6 bg-transparent"
          }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 group-hover:border-primary/60 transition-colors">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display text-2xl font-bold tracking-[0.06em] text-white group-hover:text-primary transition-colors">
              Cricket<span className="text-primary">AI</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-xs font-black tracking-[0.2em] uppercase transition-all duration-300 hover:text-primary px-1 ${location.pathname === link.path ? "text-primary border-b border-primary pb-0.5" : "text-white/70"
                  }`}
              >
                {link.name}
              </Link>
            ))}

            {user ? (
              <button
                onClick={logout}
                className="text-xs font-black tracking-[0.2em] uppercase transition-all duration-300 hover:text-primary px-1 text-white/70 cursor-pointer select-none"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="text-xs font-black tracking-[0.2em] uppercase transition-all duration-300 hover:text-primary px-1 text-white/70"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <button
            className="md:hidden text-white p-2 hover:bg-white/5 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[110] bg-background flex flex-col items-center justify-center gap-5 p-8"
          >
            <button
              className="absolute top-8 right-8 text-white p-2 hover:bg-white/5 rounded-full transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-8 h-8" />
            </button>

            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-2xl font-display font-medium tracking-widest uppercase transition-colors hover:text-primary ${location.pathname === link.path ? "text-primary" : "text-white"
                  }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="flex flex-col items-center gap-3 mt-4 w-full">
              {user ? (
                <>
                  <span className="text-xs text-white/50 font-mono">Hi, {user.username}</span>
                  <button
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    className="flex items-center justify-center gap-1.5 border border-red-500/30 hover:border-red-500 text-red-500 hover:bg-red-500/5 px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 w-auto min-w-[140px]"
                  >
                    <LogOut size={12} />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 border border-[#00FF87]/30 hover:border-[#00FF87] text-[#00FF87] hover:bg-[#00FF87]/5 px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 w-auto min-w-[140px]"
                >
                  <LogIn size={12} />
                  Login
                </Link>
              )}

              <Link
                to={user ? "/dashboard" : "/login"}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center bg-[#00FF87] hover:bg-[#00FF87]/90 text-black px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(0,255,135,0.25)] text-center w-auto min-w-[140px]"
              >
                Start Analysing
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
