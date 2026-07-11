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

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-[105] bg-black/60 backdrop-blur-sm md:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed inset-x-0 top-0 z-[110] bg-[#040810]/95 backdrop-blur-2xl border-b border-white/5 flex flex-col gap-6 py-6 px-6 shadow-[0_15px_40px_rgba(0,0,0,0.9)] rounded-b-[24px] md:hidden"
            >
              {/* Header inside drawer */}
              <div className="flex items-center justify-between">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-display text-lg font-bold tracking-[0.06em] text-white">
                    Cricket<span className="text-primary">AI</span>
                  </span>
                </Link>
                <button
                  className="text-white p-1.5 hover:bg-white/5 rounded-full transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="flex flex-col gap-4 mt-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-base font-mono uppercase tracking-[0.2em] font-semibold transition-colors hover:text-primary ${
                      location.pathname === link.path ? "text-primary" : "text-white/80"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 mt-2 border-t border-white/5 pt-5 w-full">
                {user ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-white/50 font-mono truncate max-w-[120px]">Hi, {user.username}</span>
                    <button
                      onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                      className="flex items-center gap-1.5 border border-red-500/30 hover:border-red-500 text-red-500 hover:bg-red-500/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all duration-300"
                    >
                      <LogOut size={10} />
                      Logout
                    </button>
                  </div>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-[#00FF87]/30 hover:border-[#00FF87] text-[#00FF87] hover:bg-[#00FF87]/5 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all duration-300 text-center"
                    >
                      <LogIn size={10} />
                      Login
                    </Link>
                    <Link
                      to={user ? "/dashboard" : "/login"}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1 flex items-center justify-center bg-[#00FF87] hover:bg-[#00FF87]/90 text-black px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(0,255,135,0.2)] text-center"
                    >
                      Analyse Match
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
