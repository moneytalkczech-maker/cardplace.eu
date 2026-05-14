import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLORS = {
  success: { bg: "bg-[rgba(167,255,0,0.12)]", border: "border-[rgba(167,255,0,0.25)]", text: "text-[#A7FF00]" },
  error: { bg: "bg-[rgba(239,68,68,0.12)]", border: "border-[rgba(239,68,68,0.25)]", text: "text-red-400" },
  info: { bg: "bg-[rgba(0,200,255,0.12)]", border: "border-[rgba(0,200,255,0.25)]", text: "text-[#00C8FF]" },
  warning: { bg: "bg-[rgba(251,191,36,0.12)]", border: "border-[rgba(251,191,36,0.25)]", text: "text-yellow-400" },
};

let nextId = 0;
let addToastFn: ((t: Toast) => void) | null = null;

export function toast(type: ToastType, message: string) {
  addToastFn?.({ id: nextId++, type, message });
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToastFn = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4000);
    };
    return () => { addToastFn = null; };
  }, []);

  const remove = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="fixed bottom-20 md:bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        const c = COLORS[t.type];
        return (
          <div key={t.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${c.bg} ${c.border} animate-slide-up`}>
            <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${c.text}`} />
            <p className="text-sm text-white flex-1">{t.message}</p>
            <button onClick={() => remove(t.id)} className="btn-ghost p-0.5 -mr-1"><X className="h-3.5 w-3.5" /></button>
          </div>
        );
      })}
    </div>
  );
}
