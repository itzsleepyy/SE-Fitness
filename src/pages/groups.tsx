import { useState, useEffect } from 'react';
import { Users, Mail, Plus, UserPlus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateGroupDialog } from '@/components/CreateGroupDialog';
import { InviteToGroupDialog } from '@/components/InviteToGroupDialog';
import { JoinGroupDialog } from '@/components/JoinGroupDialog';
import { fetchGroups, leaveGroup } from '@/lib/api';
import type { Group } from '@/lib/types';

export function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [invitingToGroup, setInvitingToGroup] = useState<Group | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await fetchGroups();
      setGroups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupCreated = (group: Group) => {
    setGroups((prev) => [...prev, group]);
  };

  const handleGroupJoined = (group: Group) => {
    setGroups((prev) => {
      const exists = prev.find((g) => g.id === group.id);
      if (exists) {
        return prev.map((g) => (g.id === group.id ? group : g));
      }
      return [...prev, group];
    });
  };

  const handleLeaveGroup = async (groupId: number) => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;

    try {
      await leaveGroup(groupId);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
    } catch (err) {
      console.error('Failed to leave group:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-lg text-gray-500">Loading groups...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Groups</h1>
        <div className="flex space-x-3">
          <Button onClick={() => setShowJoinModal(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Join Group
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Group
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <div
            key={group.id}
            className="overflow-hidden rounded-lg bg-white shadow"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {group.name}
                  </h3>
                  <p className="text-sm text-gray-500">{group.description}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="mt-6 flex space-x-3">
                {group.is_member ? (
                  <>
                    {group.is_creator && (
                      <Button
                        variant="default"
                        className="flex-1"
                        onClick={() => setInvitingToGroup(group)}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Invite Members
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleLeaveGroup(group.id)}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Leave Group
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={() => setShowJoinModal(true)}
                  >
                    Join Group
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <CreateGroupDialog
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onGroupCreated={handleGroupCreated}
      />

      <JoinGroupDialog
        open={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onGroupJoined={handleGroupJoined}
      />

      <InviteToGroupDialog
        group={invitingToGroup}
        open={!!invitingToGroup}
        onClose={() => setInvitingToGroup(null)}
      />
    </div>
  );
}