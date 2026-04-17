import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Zap, Menu, X } from "lucide-react";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-lg font-bold tracking-[0.15em] uppercase transition-all duration-300 hover:text-primary px-2 ${location.pathname === link.path ? "text-primary border-b-2 border-primary/50 pb-1" : "text-white/70"
                  }`}
              >
                {link.name}
              </Link>
            ))}
            <Link to="/dashboard" className="btn-primary py-3 px-8 font-black uppercase tracking-widest text-sm ml-4 shadow-[0_0_20px_rgba(0,255,128,0.2)] hover:shadow-[0_0_30px_rgba(0,255,128,0.4)]">
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Trigger */}
          <button
            className="md:hidden text-white"
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
            className="fixed inset-0 z-[110] bg-background flex flex-col items-center justify-center gap-8 p-10"
          >
            <button
              className="absolute top-8 right-8 text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-8 h-8" />
            </button>

            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-4xl font-display font-medium tracking-wide ${location.pathname === link.path ? "text-primary" : "text-white"
                  }`}
              >
                {link.name}
              </Link>
            ))}

            <Link
              to="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="btn-primary text-xl px-12 py-4 mt-4"
            >
              Start Analysing
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
