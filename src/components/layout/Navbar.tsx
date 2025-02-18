import { Link } from "react-router-dom";
import { Bell, Menu, Settings, LogOut, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { useToast } from "../ui/use-toast";
import { TransactionForm } from "../transactions/TransactionForm";
import { useState, useEffect } from "react";
import { getCategories } from "@/lib/services/transaction.service";
import type { TransactionCategory } from "@/types/transaction";
import { Navigation } from "./Navigation";

export function Navbar() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);

  useEffect(() => {
    if (user) {
      getCategories(user.id).then((data) => {
        if (data) setCategories(data);
      });
    }
  }, [user]);

  return (
    <div className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] p-4">
              <Navigation className="mt-4" />
            </SheetContent>
          </Sheet>
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">SpendWise</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="mr-2">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle transaction</DialogTitle>
              </DialogHeader>
              <TransactionForm 
                categories={categories}
                onSuccess={() => {
                  toast({
                    title: "Transaction ajoutée",
                    description: "La transaction a été ajoutée avec succès",
                  });
                  setIsOpen(false);
                }} 
              />
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.user_metadata?.avatar_url}
                    alt={user?.user_metadata?.full_name}
                  />
                  <AvatarFallback>
                    {user?.user_metadata?.full_name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="flex-col items-start">
                <div className="text-sm font-medium">
                  {user?.user_metadata?.full_name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {user?.email}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await signOut();
                  } catch (error) {
                    toast({
                      variant: "destructive",
                      title: "Erreur",
                      description: "Échec de la déconnexion.",
                    });
                  }
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
