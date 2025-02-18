import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyGroups } from '@/lib/groups';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, Users, ArrowRight } from 'lucide-react';
import { CreateGroupDialog } from './CreateGroupDialog';
import { slugify } from '@/lib/utils/slugify';

interface Group {
  id: string;
  name: string;
  description?: string;
  members?: Array<{
    user_id: string;
    profiles?: {
      id: string;
      full_name?: string;
      avatar_url?: string;
    };
  }>;
}

export function GroupList() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    try {
      const groupsData = await getMyGroups();
      setGroups(groupsData);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  }

  function handleGroupClick(group: Group) {
    const slug = slugify(group.name);
    navigate(`/groups/${slug}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mes groupes</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nouveau groupe
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card 
            key={group.id} 
            className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleGroupClick(group)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{group.name}</h3>
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Membres</p>
              <div className="flex -space-x-2">
                {group.members?.map((member) => (
                  <Avatar key={member.user_id} className="border-2 border-background">
                    <AvatarImage src={member.profiles?.avatar_url} />
                    <AvatarFallback>
                      {member.profiles?.full_name?.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <CreateGroupDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
        onGroupCreated={loadGroups}
      />
    </div>
  );
}
