"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Briefcase,
  FileEdit,
  ScanSearch,
  ClipboardList,
  Settings,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resume", label: "Resume", icon: FileText },
  { href: "/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/jobs", label: "Job Matches", icon: Briefcase },
  { href: "/tailor", label: "Resume Tailor", icon: FileEdit },
  { href: "/ats", label: "ATS Optimizer", icon: ScanSearch },
  { href: "/applications", label: "Applications", icon: ClipboardList },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-[64px] items-center gap-2.5 px-5 border-b border-white/10">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 text-black">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="leading-none">
          <div className="text-sm font-semibold tracking-tight">CareerPilot AI</div>
          <div className="text-[11px] text-zinc-400">Career Compass Director</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active ? "bg-white text-black" : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3">
          <div className="text-xs font-medium text-cyan-200">Powered by Lyzr</div>
          <div className="text-[11px] leading-relaxed text-zinc-400">Multi-agent intelligence via Career Compass Director.</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-[264px] shrink-0 flex-col border-r border-white/10 bg-[#0F1216]">{content}</aside>

      {/* Mobile topbar */}
      <div className="lg:hidden sticky top-0 z-40 flex h-[56px] items-center justify-between border-b border-white/10 bg-[#0F1216] px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500">
            <Sparkles className="h-4 w-4 text-black" />
          </div>
          <span className="text-sm font-semibold">CareerPilot AI</span>
        </div>
        <button
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] border-r border-white/10 bg-[#0F1216]"
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
