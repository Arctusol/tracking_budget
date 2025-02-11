import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddMemberDialogProps {
  groupId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMemberAdded: () => void;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

export function AddMemberDialog({ groupId, open, onOpenChange, onMemberAdded }: AddMemberDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [role, setRole] = useState<"member" | "admin">("member");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleSearch(value: string) {
    setSearchTerm(value);
    if (value.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .or(`full_name.ilike.%${value.toLowerCase()}%,email.ilike.%${value.toLowerCase()}%`)
        .limit(5);

      console.log('Résultats de la recherche:', { data, error });
      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    }
  }

  const handleAddMember = async () => {
    if (!selectedUser || !groupId) return;

    setLoading(true);
    try {
      await addGroupMember(groupId, selectedUser.id, role);
      toast({
        title: "Succès",
        description: "Membre ajouté au groupe avec succès",
      });
      onMemberAdded();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le membre au groupe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un membre au groupe</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Rechercher un utilisateur</Label>
            <Input
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {selectedUser && (
            <div className="space-y-2">
              <Label>Rôle du membre</Label>
              <Select value={role} onValueChange={(value: "member" | "admin") => setRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membre</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>
                      {user.full_name?.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setSelectedUser(user);
                    setSearchTerm(user.full_name || '');
                  }}
                  disabled={loading}
                >
                  Sélectionner
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleAddMember} disabled={!selectedUser || loading}>
            {loading ? "Ajout en cours..." : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

async function addGroupMember(groupId: string, userId: string, role: 'admin' | 'member' = 'member') {
  const { data: member, error: memberError } = await supabase
    .from('group_members')
    .insert([{ group_id: groupId, user_id: userId, role }])
    .select()
    .single();

  if (memberError) throw memberError;

  // Récupérer toutes les transactions du groupe
  const { data: groupTransactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('id')
    .eq('group_id', groupId);

  if (transactionsError) throw transactionsError;

  // Créer les partages pour toutes les transactions existantes
  if (groupTransactions && groupTransactions.length > 0) {
    const shares = groupTransactions.map(transaction => ({
      transaction_id: transaction.id,
      user_id: userId,
      group_id: groupId,
      split_type: 'equal',
      percentage: null,
      amount: null
    }));

    const { error: sharesError } = await supabase
      .from('transaction_shares')
      .insert(shares);

    if (sharesError) throw sharesError;
  }

  return member;
} 