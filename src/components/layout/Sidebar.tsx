import {
  BarChart3,
  CreditCard,
  FileText,
  Home,
  PieChart,
  Users,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Tableau de Bord", href: "/", icon: Home, current: true },
  {
    name: "Transactions",
    href: "/transactions",
    icon: CreditCard,
    current: false,
  },
  { name: "Import", href: "/import", icon: Upload, current: false },
  { name: "Analyses", href: "/analytics", icon: PieChart, current: false },
  { name: "Budgets", href: "/budgets", icon: BarChart3, current: false },
  { name: "Rapports", href: "/reports", icon: FileText, current: false },
  { name: "Partagé", href: "/shared", icon: Users, current: false },
];

export function Sidebar() {
  return (
    <div className="hidden md:flex h-full w-64 flex-col fixed inset-y-0 z-50">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-white px-6 pb-4">
        <div className="h-16"></div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className={cn(
                        "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6",
                        item.current
                          ? "bg-gray-50 text-primary"
                          : "text-gray-700 hover:bg-gray-50",
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
