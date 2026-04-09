'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Shield, ArrowRight, BookOpen, GraduationCap, MapPin, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage() {
  const router = useRouter();
  const { loginAsAdmin, loginAsUser, isAuthenticated, isAdmin } = useAuth();
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace(isAdmin ? '/' : '/browse');
  }, [isAuthenticated, isAdmin, router]);

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#080808] text-white selection:bg-amber-500/30 overflow-hidden font-light">
      
      {/* --- BACKGROUND ARTISTRY --- */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Animated Mesh Gradient */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ willChange: 'transform' }}
          className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-amber-600/10 to-transparent blur-[120px]" 
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30 mix-blend-overlay" />
        
        {/* Large Decorative Floating Devanagari */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center opacity-[0.02] pointer-events-none select-none">
          <span className="text-[30vw] font-bold font-[var(--font-devanagari)] leading-none">
            गणगौर
          </span>
        </div>
      </div>

      {/* --- HEADER --- */}
      <header className="relative z-50 flex justify-between items-center p-8 lg:px-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white flex items-center justify-center rounded-full group cursor-pointer hover:scale-110 transition-transform duration-500">
            <BookOpen className="w-5 h-5 text-black" />
          </div>
          <div className="h-px w-8 bg-white/20" />
          <span className="text-[10px] tracking-[0.5em] font-bold uppercase text-amber-500/80">
            Shree Gangaur Library
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-[10px] tracking-[0.2em] font-bold uppercase opacity-40">
          <span>Focus</span>
          <span className="w-1 h-1 bg-amber-500 rounded-full" />
          <span>Silence</span>
          <span className="w-1 h-1 bg-amber-500 rounded-full" />
          <span>Success</span>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] px-6">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-8"
        >
          {/* Main Title with Gold Foil Effect */}
          <div className="relative inline-block">
            <h1 className="font-[var(--font-devanagari)] text-8xl md:text-[10rem] leading-none text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              श्री गणगौर
            </h1>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.8, duration: 1.5 }}
              className="h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent absolute -bottom-4" 
            />
          </div>

          <p className="text-lg md:text-xl text-white/40 tracking-[0.1em] font-extralight max-w-2xl mx-auto italic leading-relaxed">
            Rajsamand's premier study environment designed for <span className="text-white/80">deep work</span> and <span className="text-white/80">academic mastery</span>.
          </p>

          {/* Call to Action Grid */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.2, delayChildren: 0.6 }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl pt-12"
          >
            
            {/* User CTA */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
              }}
              whileHover={{ y: -5, scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
              className="relative group cursor-pointer"
              onClick={() => { loginAsUser(); router.push('/browse'); }}
            >
              <div className="absolute inset-0 bg-amber-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative w-full h-24 bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-between px-8 transition-all group-hover:bg-white group-hover:text-black overflow-hidden rounded-md">
                <div className="text-left pointer-events-none">
                  <p className="text-[8px] font-bold uppercase tracking-widest opacity-50 mb-1">Student Portal</p>
                  <p className="text-lg font-medium tracking-tight">Reserve Your Space</p>
                </div>
                <GraduationCap className="w-6 h-6 group-hover:scale-110 transition-transform pointer-events-none" />
              </div>
            </motion.div>

            {/* Admin Portal Interaction */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="relative group"
            >
              <div className={cn(
                "w-full h-24 bg-black/40 backdrop-blur-md border border-white/5 flex flex-col justify-center px-8 transition-all duration-500 rounded-md",
                pinError ? "border-red-500/50" : "hover:border-amber-500/40"
              )}>
                <div className="flex justify-between items-center mb-1 drop-shadow-md">
                   <p className="text-[10px] font-bold uppercase tracking-widest opacity-30">Management PIN</p>
                   {pinError && <span className="text-[9px] text-red-500 font-bold uppercase">Invalid</span>}
                </div>
                <div className="flex items-center group/input">
                  <input 
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setPinError(false); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') loginAsAdmin(pin);
                    }}
                    placeholder="••••••"
                    className="bg-transparent border-none outline-none text-2xl tracking-[0.4em] font-mono text-amber-500 w-full placeholder:text-white/5"
                  />
                  <div 
                    role="button"
                    tabIndex={0}
                    onClick={() => loginAsAdmin(pin)}
                    onKeyDown={(e) => e.key === 'Enter' && loginAsAdmin(pin)}
                    className="p-2 hover:bg-white/5 active:scale-90 rounded-full transition-all cursor-pointer focus-visible"
                    aria-label="Login as Admin"
                  >
                    <Shield className="w-4 h-4 text-white/40 group-hover/input:text-amber-500/70 transition-colors" />
                  </div>
                </div>
              </div>
            </motion.div>

          </motion.div>
        </motion.div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="absolute bottom-0 w-full p-8 lg:px-12 flex flex-col md:flex-row justify-between items-end md:items-center gap-6 border-t border-white/5">
        <div className="flex items-center gap-4 text-[10px] font-black tracking-[0.3em] uppercase text-white/20">
          <MapPin className="w-3 h-3 text-amber-500" />
          Kankroli, Rajsamand
        </div>
        
        <div className="flex items-center gap-8">
          <a href="#" className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">
             Rules & Conduct <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
          <div className="h-4 w-px bg-white/10" />
          <p className="text-[10px] font-bold text-white/10 tracking-[0.5em] uppercase">© 2026 GANGAUR</p>
        </div>
      </footer>

      {/* Decorative Golden Corner */}
      <div className="absolute bottom-0 right-0 w-px h-24 bg-gradient-to-t from-amber-500 to-transparent opacity-40" />
      <div className="absolute bottom-0 right-0 h-px w-24 bg-gradient-to-l from-amber-500 to-transparent opacity-40" />

    </div>
  );
}