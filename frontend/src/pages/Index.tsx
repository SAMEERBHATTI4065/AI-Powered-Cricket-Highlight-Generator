import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Film, X, ArrowRight, Loader2, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import cricketHero from "@/assets/cricket-hero.jpg";

const UploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type.startsWith("video/")) {
      setFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected?.type.startsWith("video/")) {
      setFile(selected);
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(10); // Start progress

    const formData = new FormData();
    formData.append('video', file);

    try {
      // Simulate progress while uploading/processing
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return 90;
          return prev + 5;
        });
      }, 500);

      const response = await fetch('/api/upload/', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      console.log("Upload success:", data);

      // Navigate to results with session_id
      setTimeout(() => navigate(`/results?session_id=${data.session_id}`), 500);

    } catch (error) {
      console.error("Error processing video:", error);
      alert("Error processing video: " + error);
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Navbar />

      {/* Hero background */}
      <div className="absolute inset-0 z-0">
        <img
          src={cricketHero}
          alt="Cricket stadium"
          className="w-full h-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/95 to-background" />
      </div>

      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-6 pt-32 pb-20">
        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} />
            AI-Powered Analysis
          </motion.div>
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-4 leading-tight">
            Cricket <span className="gradient-text">Highlight</span>
            <br />
            <span className="gradient-text-gold">Generator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Upload your cricket match video and let AI automatically detect boundaries,
            sixes, wickets & generate highlights in minutes.
          </p>
        </motion.div>

        {/* Upload zone */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          <AnimatePresence mode="wait">
            {!file ? (
              <motion.label
                key="upload"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`upload-zone flex flex-col items-center justify-center py-20 px-8 ${dragging ? "dragging" : ""}`}
              >
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20"
                >
                  <Upload className="w-8 h-8 text-primary" />
                </motion.div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  Drop your match video here
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  or click to browse • MP4, AVI, MKV supported
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Full match videos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Up to 4 hours
                  </span>
                </div>
              </motion.label>
            ) : (
              <motion.div
                key="selected"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card p-8"
              >
                {/* File info */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Film className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  {!processing && (
                    <button
                      onClick={() => setFile(null)}
                      className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                {processing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6"
                  >
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        {progress < 30 ? "Extracting frames..." : progress < 60 ? "Reading scoreboard (OCR)..." : progress < 85 ? "Detecting events..." : "Generating highlights..."}
                      </span>
                      <span className="text-primary font-medium">{Math.min(100, Math.round(progress))}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, progress)}%`,
                          background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--cricket-gold)))",
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Process button */}
                {!processing && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleProcess}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-display font-semibold text-primary-foreground transition-all cricket-pulse"
                    style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--cricket-green-glow)))" }}
                  >
                    <Zap className="w-5 h-5" />
                    Generate Highlights
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-16"
        >
          {[
            { icon: "🏏", title: "Event Detection", desc: "Boundaries, sixes, wickets detected automatically" },
            { icon: "📝", title: "Text Summary", desc: "Chronological match summary with all key events" },
            { icon: "🎬", title: "Highlight Reel", desc: "Auto-compiled video with all the best moments" },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="glass-card p-5 text-center hover:border-primary/30 transition-colors"
            >
              <span className="text-3xl mb-3 block">{feature.icon}</span>
              <h3 className="font-display font-semibold text-foreground text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default UploadPage;
