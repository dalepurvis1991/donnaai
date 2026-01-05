import { AlertCircle, ArrowLeft, Command } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#101522] text-white overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 max-w-md w-full mx-4 p-12 rounded-[3rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl ring-1 ring-white/5 text-center space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="size-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mx-auto shadow-glow-sm">
          <AlertCircle className="size-10 text-primary animate-pulse" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3 text-primary mb-2">
            <Command className="size-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Neural Protocol Error</span>
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">404: Link Severed</h1>
          <p className="text-slate-500 italic text-sm leading-relaxed">
            The requested neural segment could not be localized within the team's active memory core. The mission path may have been decommissioned or moved.
          </p>
        </div>

        <Button
          onClick={() => window.location.href = "/"}
          className="w-full bg-primary hover:bg-primary/90 shadow-glow rounded-2xl h-14 font-black italic uppercase tracking-widest text-[11px]"
        >
          <ArrowLeft className="size-4 mr-3" />
          Reconnect to Command
        </Button>

        <div className="pt-4 flex justify-center">
          <div className="flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-slate-800 animate-bounce [animation-delay:-0.3s]"></div>
            <div className="size-1.5 rounded-full bg-slate-800 animate-bounce [animation-delay:-0.15s]"></div>
            <div className="size-1.5 rounded-full bg-slate-800 animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
