import React, { useState, useEffect } from "react";
import { Smartphone, Monitor, RefreshCw, Palette, Power, HelpCircle } from "lucide-react";

interface SimulatorWrapperProps {
  children: React.ReactNode;
}

const SimulatorWrapper: React.FC<SimulatorWrapperProps> = ({ children }) => {
  const [isSimulatorActive, setIsSimulatorActive] = useState(false);
  const [deviceColor, setDeviceColor] = useState<"titanium" | "purple" | "gold" | "black">("titanium");
  const [isLandscape, setIsLandscape] = useState(false);
  const [showStatusBar, setShowStatusBar] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Update clock inside simulator status bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Detect screen size to hide on actual mobile/tablets
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  if (!isLargeScreen) {
    // On actual mobile/tablet screens, just render the app normally
    return <>{children}</>;
  }

  const bezelColors = {
    titanium: "border-slate-400 bg-slate-500 shadow-slate-400/20",
    purple: "border-purple-900 bg-purple-950 shadow-purple-950/20",
    gold: "border-amber-600 bg-amber-700 shadow-amber-700/20",
    black: "border-zinc-800 bg-zinc-900 shadow-zinc-900/20",
  };

  return (
    <div className="min-h-screen bg-background relative transition-colors duration-500">
      {isSimulatorActive ? (
        <div className="fixed inset-0 z-[1000] bg-[#05080F] flex items-center justify-center p-6 overflow-hidden">
          {/* Neon Grid Background */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#00ff87_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
          <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
          <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

          {/* Sandbox Workspace Grid */}
          <div className="w-full h-full max-w-7xl flex gap-8 items-center justify-between relative z-10">
            
            {/* Left Control Panel: Sci-Fi Styling */}
            <div className="w-[340px] shrink-0 p-8 glass-card border-white/5 flex flex-col gap-6 text-left shadow-2xl">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-black">Simulation Active</span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white mb-1">MOBILE SANDBOX</h2>
                <p className="text-white/40 text-xs font-mono">Device: iPhone 15 Pro Max • iOS 18.0</p>
              </div>

              <div className="h-px bg-white/5" />

              {/* Controls */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 block">Device Chassis</label>
                  <div className="flex gap-3">
                    {(["titanium", "purple", "gold", "black"] as const).map((color) => (
                      <button
                        key={color}
                        onClick={() => setDeviceColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                          deviceColor === color ? "border-primary scale-110" : "border-white/10 hover:border-white/30"
                        }`}
                        style={{
                          backgroundColor:
                            color === "titanium"
                              ? "#8e8e93"
                              : color === "purple"
                              ? "#3b2f4f"
                              : color === "gold"
                              ? "#e5c158"
                              : "#1c1c1e",
                        }}
                        title={color.toUpperCase()}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 block">Layout Mode</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsLandscape(false)}
                      className={`flex-1 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                        !isLandscape
                          ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(0,255,135,0.25)]"
                          : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <Smartphone size={14} />
                      Portrait
                    </button>
                    <button
                      onClick={() => setIsLandscape(true)}
                      className={`flex-1 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                        isLandscape
                          ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(0,255,135,0.25)]"
                          : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <Smartphone className="rotate-90" size={14} />
                      Landscape
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-white/60">Simulate Status Bar</span>
                    <button
                      onClick={() => setShowStatusBar(!showStatusBar)}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors ${showStatusBar ? "bg-primary" : "bg-white/10"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-black transition-transform ${showStatusBar ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/5 mt-auto" />

              {/* Info panel */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] leading-relaxed text-white/50 font-mono">
                <HelpCircle className="w-4 h-4 text-primary inline mr-1.5 -mt-0.5" />
                This simulator runs the live production code inside a high-fidelity viewport to test responsiveness and user flows.
              </div>

              {/* Exit Simulator Button */}
              <button
                onClick={() => setIsSimulatorActive(false)}
                className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
              >
                <Monitor size={14} />
                Return to Desktop View
              </button>
            </div>

            {/* Right: Phone Emulation Wrapper */}
            <div className="flex-1 h-full flex items-center justify-center relative">
              <div
                className={`relative transition-all duration-500 border-[12px] rounded-[3rem] overflow-hidden flex flex-col items-center justify-center bg-black shadow-[0_25px_60px_rgba(0,0,0,0.8)] ${
                  bezelColors[deviceColor]
                } ${isLandscape ? "w-[880px] h-[410px]" : "w-[390px] h-[810px]"}`}
              >
                {/* Dynamic Island */}
                {!isLandscape && (
                  <div className="absolute top-3.5 left-1/2 transform -translate-x-1/2 w-28 h-7 bg-black rounded-full z-[1001] flex items-center justify-center border border-white/5 shadow-inner">
                    <div className="w-3.5 h-3.5 rounded-full bg-slate-900/80 border border-slate-800/50 absolute left-3 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-950/80" />
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900/80 absolute right-6" />
                  </div>
                )}

                {/* Status Bar */}
                {showStatusBar && !isLandscape && (
                  <div className="absolute top-0 left-0 right-0 h-12 px-8 flex items-center justify-between text-[11px] font-bold text-white z-[1000] select-none pointer-events-none bg-black/10">
                    <span>{currentTime}</span>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L16.35 6.25C15.17 4.23 13.73 3 12 3zm6.35 3.39L4.97 17.75C6.15 19.77 7.59 21 9.32 21c4.97 0 9-4.03 9-9 0-2.12-.74-4.07-1.97-5.61z" />
                      </svg>
                      <span className="font-mono text-[9px] bg-white/20 px-1 rounded-sm">5G</span>
                      <div className="w-5 h-2.5 rounded-[4px] border border-white/40 p-0.5 flex items-center">
                        <div className="h-full w-3.5 bg-white rounded-[2px]" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Application viewport container */}
                <div className={`w-full h-full overflow-y-auto hide-scrollbar relative bg-[#05080F] ${showStatusBar && !isLandscape ? "pt-12" : ""}`}>
                  {children}
                </div>

                {/* Home Indicator bar */}
                {!isLandscape && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1.5 bg-white/50 rounded-full z-[1001] pointer-events-none" />
                )}
              </div>
            </div>

          </div>
        </div>
      ) : (
        <>
          {children}

          {/* Floating Sandbox Toggle Button */}
          <button
            onClick={() => setIsSimulatorActive(true)}
            className="fixed bottom-6 right-6 z-[999] group bg-primary hover:bg-primary/95 text-black h-12 px-5 rounded-full flex items-center gap-2.5 font-bold uppercase tracking-widest text-[10px] shadow-[0_4px_25px_rgba(0,255,135,0.4)] hover:shadow-[0_8px_35px_rgba(0,255,135,0.6)] active:scale-95 transition-all"
          >
            <Smartphone className="w-4 h-4 animate-bounce" style={{ animationDuration: "2.5s" }} />
            <span>Mobile Simulator</span>
          </button>
        </>
      )}
    </div>
  );
};

export default SimulatorWrapper;
