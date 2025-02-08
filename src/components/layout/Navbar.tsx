import { Bell, Menu, Settings, LogOut } from "lucide-react";
import { AddExpenseDialog } from "../expenses/AddExpenseDialog";
import { Button } from "../ui/button";
import { useAuth } from "@/lib/auth";
import { useToast } from "../ui/use-toast";

export function Navbar() {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
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
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              try {
                await signOut();
              } catch (error) {
                toast({
                  variant: "destructive",
                  title: "Error",
                  description: "Failed to sign out.",
                });
              }
            }}
          >
            <LogOut className="h-5 w-5" />
          </Button>
          <span className="ml-4 text-sm text-gray-600">{user?.email}</span>
        </div>
      </div>
    </div>
  );
}
