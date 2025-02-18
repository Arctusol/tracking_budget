import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { UserPlus, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AddMemberDialog } from '@/components/groups/AddMemberDialog';
import { AddGroupTransactionsDialog } from '../groups/AddGroupTransactionsDialog';
import { Dashboard } from './Dashboard';
import { Button } from '@/components/ui/button';
import { slugify, deslugify } from '@/lib/utils/slugify';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

interface Group {
  id: string;
  name: string;
  members: { profiles: Profile }[];
}

export function GroupDashboard() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddTransactionsOpen, setIsAddTransactionsOpen] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');

  useEffect(() => {
    if (!slug) return;
    loadGroupData();
  }, [slug]);

  async function loadGroupData() {
    try {
      // Rechercher le groupe par son slug (nom formaté)
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select(`
          *,
          members:group_members(
            profiles(
              id,
              full_name,
              email,
              avatar_url
            )
          )
        `)
        .ilike('name', deslugify(slug || ''))
        .single();

      if (groupError) throw groupError;
      
      // Vérifier si l'URL correspond au slug actuel du groupe
      const currentSlug = slugify(groupData.name);
      if (currentSlug !== slug) {
        // Rediriger vers l'URL avec le bon slug si nécessaire
        navigate(`/groups/${currentSlug}`, { replace: true });
        return;
      }

      setGroup(groupData);
      
      const memberProfiles = groupData.members
        .map((m: any) => m.profiles)
        .filter(Boolean);
      setMembers(memberProfiles);
    } catch (error) {
      console.error('Error loading group data:', error);
      // Rediriger vers la page des groupes en cas d'erreur
      navigate('/groups');
    }
  }

  if (!group?.id) return null;

  return (
    <div className="w-full p-5">
      {/* En-tête du groupe */}
      <div className="flex items-center justify-between ">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            <h1 className={`font-bold ${fontSize === 'large' ? 'text-3xl' : 'text-2xl'}`}>
              {group.name}
            </h1>
            <div className="flex -space-x-2">
              {members.map((member) => (
                <Avatar key={member.id} className="border-2 border-background w-8 h-8">
                  <AvatarImage src={member.avatar_url} />
                  <AvatarFallback>
                    {member.full_name?.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>

        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsAddMemberOpen(true)}
            className="h-9"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Ajouter un membre
          </Button>
          <Button
            onClick={() => setIsAddTransactionsOpen(true)}
            className="h-9"
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter des transactions
          </Button>
        </div>
      </div>

      {/* Dashboard principal */}
      <Dashboard
        groupId={group.id}
        members={members}
        onAddMember={() => setIsAddMemberOpen(true)}
      />

      {/* Dialogues */}
      <AddMemberDialog
        open={isAddMemberOpen}
        onOpenChange={setIsAddMemberOpen}
        groupId={group.id}
        onMemberAdded={loadGroupData}
      />

      <AddGroupTransactionsDialog
        open={isAddTransactionsOpen}
        onOpenChange={setIsAddTransactionsOpen}
        groupId={group.id}
        onTransactionsAdded={loadGroupData}
      />
    </div>
  );
}
