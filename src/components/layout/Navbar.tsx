import { Bell, Menu, Settings } from "lucide-react";
import { AddExpenseDialog } from "../expenses/AddExpenseDialog";
import { Button } from "../ui/button";

export function Navbar() {
  return (
    <div className="border-b bg-white">
      <div className="flex h-16 items-center px-4 max-w-7xl mx-auto">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>

        <div className="font-bold text-xl ml-4 md:ml-0">SpendWise</div>

        <div className="ml-auto flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          <AddExpenseDialog />
        </div>
      </div>
    </div>
  );
}
