import { NavLink } from "react-router-dom";
import { Home, Users, Upload, Receipt, BarChart3, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Tableau de Bord", href: "/app", icon: BarChart3 },
  { name: "Transactions", href: "/app/transactions", icon: Receipt },
  { name: "Groupes", href: "/app/groups", icon: Users },
  { name: "Import", href: "/app/import", icon: Upload },
  { name: "Import tickets de caisse", href: "/app/receipts", icon: Receipt },
  { name: "Analyse des tickets de caisse", href: "/app/receipts-dashboard", icon: FileText },
];

export function Navigation({ className }: { className?: string }) {
  return (
    <nav className={cn("flex flex-col space-y-1", className)}>
      {navigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md",
              "hover:bg-primary/10 hover:text-primary",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground"
            )
          }
          end
        >
          <item.icon className="mr-3 h-5 w-5" />
          {item.name}
        </NavLink>
      ))}
    </nav>
  );
}
