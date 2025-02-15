import { NavLink } from "react-router-dom";
import { Home, Users, Upload, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Tableau de Bord", href: "/", icon: Home },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Groupes", href: "/groups", icon: Users },
  { name: "Import", href: "/import", icon: Upload },
  { name: "Import tickets de caisse", href: "/receipts", icon: Receipt },
  { name: "Analyse des tickets de caisse", href: "/receipts-dashboard", icon: Receipt },
];

export function Navigation() {
  return (
    <nav className="flex flex-col space-y-1">
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
