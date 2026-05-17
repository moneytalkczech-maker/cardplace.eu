import { LucideIcon, Construction } from "lucide-react";
import AdminLayout from "../components/AdminLayout";

interface AdminStubProps {
  title: string;
  description: string;
  icon: LucideIcon;
  status?: "development" | "planned" | "beta";
}

export default function AdminStubPage({ title, description, icon: Icon, status = "development" }: AdminStubProps) {
  const statusConfig = {
    development: { label: "Ve vývoji", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    planned: { label: "Plánováno", color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20" },
    beta: { label: "Beta", color: "text-[#00C8FF]", bg: "bg-[#00C8FF]/10", border: "border-[#00C8FF]/20" },
  };

  const cfg = statusConfig[status];

  return (
    <AdminLayout title={title}>
      <div className="text-center py-20 text-gray-500 max-w-lg mx-auto">
        <div className="relative inline-block mb-6">
          <Icon className="h-16 w-16 opacity-20" />
          <Construction className={`h-6 w-6 absolute -top-1 -right-1 ${cfg.color}`} />
        </div>
        <h2 className="text-xl font-heading font-bold mb-3">{title}</h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">{description}</p>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color} text-xs font-heading font-semibold`}>
          <Construction className="h-4 w-4" />
          {cfg.label}
        </div>
      </div>
    </AdminLayout>
  );
}
