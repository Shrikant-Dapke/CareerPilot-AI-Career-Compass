import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
};

export function Button({ className, variant = "primary", size = "md", ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 disabled:opacity-50 disabled:pointer-events-none",
        variant === "primary" && "bg-white text-black hover:bg-zinc-100",
        variant === "ghost" && "bg-white/[0.06] text-white hover:bg-white/[0.10] border border-white/10",
        variant === "outline" && "border border-white/15 text-white hover:bg-white/[0.06]",
        size === "sm" && "h-8 px-3.5 text-sm",
        size === "md" && "h-10 px-5 text-sm",
        size === "lg" && "h-11 px-7 text-[15px]",
        className
      )}
      {...props}
    />
  );
}
