import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { isAdminLoggedIn, clearAdminSession } from '../../lib/admin';
import { getAllGroups, deleteGroup as deleteGroupKV } from '../../lib/kv';

export default function AdminDashboard() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalParticipants: 0,
    drawnGroups: 0,
  });

  useEffect(() => {
    // Check auth
    if (!isAdminLoggedIn()) {
      router.push('/admin/login');
      return;
    }

    // Load groups from localStorage (in production, load from KV)
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      let allGroups = [];

      // Try to load from KV first (primary storage)
      try {
        allGroups = await getAllGroups();
        console.log('✅ Loaded groups from KV');
      } catch (kvErr) {
        console.warn('KV not available, trying localStorage:', kvErr);

        // Fallback to localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('group_')) {
            const groupData = JSON.parse(localStorage.getItem(key));
            allGroups.push(groupData);
          }
        }
      }

      // Sort by date, newest first
      allGroups.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setGroups(allGroups);

      // Calculate stats
      const stats = {
        totalGroups: allGroups.length,
        totalParticipants: allGroups.reduce(
          (sum, g) => sum + (g.participants?.length || 0),
          0
        ),
        drawnGroups: allGroups.filter(g => g.drawn).length,
      };
      setStats(stats);
    } catch (err) {
      console.error('Error loading groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    router.push('/');
  };

  const deleteGroup = async (groupId) => {
    if (window.confirm('🗑️ Wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) {
      try {
        // Delete from KV (primary)
        await deleteGroupKV(groupId);
        console.log('✅ Group deleted from KV');
      } catch (kvErr) {
        console.warn('KV delete failed, using localStorage:', kvErr);
      }

      // Also delete from localStorage
      localStorage.removeItem(`group_${groupId}`);
      localStorage.removeItem(`organizer_${groupId}`);

      loadGroups();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-2xl">🔄 Lädt...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 p-6">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-1">🔐 Admin Dashboard</h1>
            <p className="text-gray-400">Julklapp Online v1.2.0 - Gruppen Management</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white">
            <div className="text-4xl font-bold">{stats.totalGroups}</div>
            <p className="text-blue-200 mt-1">Gruppen gesamt</p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6 text-white">
            <div className="text-4xl font-bold">{stats.totalParticipants}</div>
            <p className="text-green-200 mt-1">Teilnehmer gesamt</p>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6 text-white">
            <div className="text-4xl font-bold">{stats.drawnGroups}</div>
            <p className="text-purple-200 mt-1">Gruppen ausgelost</p>
          </div>
        </div>

        {/* Groups Table */}
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">📋 Alle Gruppen</h2>
          </div>

          {groups.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-700 text-white text-sm font-semibold">
                    <th className="px-6 py-3 text-left">Gruppe</th>
                    <th className="px-6 py-3 text-left">Budget</th>
                    <th className="px-6 py-3 text-left">Teilnehmer</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Erstellt</th>
                    <th className="px-6 py-3 text-left">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr
                      key={group.id}
                      className="border-b border-gray-700 hover:bg-gray-750 transition"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-white">{group.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{group.id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{group.budget}</td>
                      <td className="px-6 py-4 text-gray-300">
                        {group.participants?.length || 0}
                      </td>
                      <td className="px-6 py-4">
                        {group.drawn ? (
                          <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            ✅ Ausgelost
                          </span>
                        ) : (
                          <span className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            ⏳ Offen
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {formatDate(group.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <a
                              href={`/organizer/${group.id}`}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-semibold flex-1 text-center"
                            >
                              🔐 Org-Dashboard
                            </a>
                            <a
                              href={`/admin/groups/${group.id}`}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-semibold"
                            >
                              👁️
                            </a>
                            <button
                              onClick={() => deleteGroup(group.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-semibold"
                            >
                              🗑️
                            </button>
                          </div>
                          {group.organizerPin && (
                            <div className="bg-gray-700 rounded px-3 py-1 text-center">
                              <p className="text-xs text-gray-300">PIN:</p>
                              <p className="text-lg font-bold text-yellow-300 tracking-widest">{group.organizerPin}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-400 text-lg">Noch keine Gruppen vorhanden</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
