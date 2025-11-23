import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { isAdminLoggedIn, clearAdminSession, getAdminAuthHeader } from '../../lib/admin';
import { getAllGroups, deleteGroup } from '../../lib/kv-client';

export default function AdminDashboard() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroups, setSelectedGroups] = useState(new Set());
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalParticipants: 0,
    drawnGroups: 0,
    avgBudget: 0,
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

      // Load from KV (primary storage - no fallback for admin)
      try {
        allGroups = await getAllGroups();
        console.log('✅ Loaded groups from KV');
      } catch (kvErr) {
        console.error('Failed to load groups from KV:', kvErr);
        // No localStorage fallback for admin panel
      }

      // Sort by date, newest first
      allGroups.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setGroups(allGroups);

      // Calculate comprehensive stats
      const totalGroups = allGroups.length;
      const totalParticipants = allGroups.reduce((sum, g) => sum + (g.participants?.length || 0), 0);
      const drawnGroups = allGroups.filter(g => g.drawn).length;

      // Budget stats - only real data we can calculate from groups
      const totalBudget = allGroups.reduce((sum, g) => {
        const budget = parseInt(g.budget?.replace('€', '').trim()) || 0;
        return sum + budget;
      }, 0);
      const avgBudget = totalGroups > 0 ? Math.round(totalBudget / totalGroups) : 0;

      const stats = {
        totalGroups,
        totalParticipants,
        drawnGroups,
        avgBudget,
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

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm('🗑️ Wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) {
      try {
        await deleteGroup(groupId);
        console.log('✅ Group deleted from KV');
        loadGroups();
      } catch (kvErr) {
        console.error('❌ Failed to delete group:', kvErr);
      }
    }
  };

  const toggleGroupSelection = (groupId) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId);
    } else {
      newSelected.add(groupId);
    }
    setSelectedGroups(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedGroups.size === groups.length) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(groups.map(g => g.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedGroups.size === 0) {
      alert('Keine Gruppen ausgewählt');
      return;
    }
    if (window.confirm(`🗑️ ${selectedGroups.size} Gruppe(n) wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden!`)) {
      try {
        for (const groupId of selectedGroups) {
          await deleteGroup(groupId);
        }
        console.log(`✅ ${selectedGroups.size} Gruppen gelöscht`);
        setSelectedGroups(new Set());
        loadGroups();
      } catch (kvErr) {
        console.error('❌ Failed to delete groups:', kvErr);
      }
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
            <p className="text-gray-400">Julklapp Online v2.0.0 - Gruppen Management</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-7xl">
        {/* Stats Grid - only real data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white">
            <div className="text-3xl font-bold">{stats.totalGroups}</div>
            <p className="text-blue-200 mt-1 text-sm">Gruppen gesamt</p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6 text-white">
            <div className="text-3xl font-bold">{stats.totalParticipants}</div>
            <p className="text-green-200 mt-1 text-sm">Teilnehmer gesamt</p>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6 text-white">
            <div className="text-3xl font-bold">{stats.drawnGroups}</div>
            <p className="text-purple-200 mt-1 text-sm">Ausgelost</p>
          </div>
          <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg p-6 text-white">
            <div className="text-3xl font-bold">{stats.avgBudget}€</div>
            <p className="text-orange-200 mt-1 text-sm">Ø Budget</p>
          </div>
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-lg p-6 text-white">
            <div className="text-3xl font-bold">{selectedGroups.size}</div>
            <p className="text-red-200 mt-1 text-sm">Ausgewählt</p>
          </div>
        </div>

        {/* Groups Table */}
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">📋 Alle Gruppen</h2>
            {selectedGroups.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm"
              >
                🗑️ {selectedGroups.size} löschen
              </button>
            )}
          </div>

          {groups.length > 0 ? (
            <div className="overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-700 text-white font-semibold">
                    <th className="px-4 py-3 text-left w-8">
                      <input
                        type="checkbox"
                        checked={selectedGroups.size === groups.length && groups.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 text-left">Gruppe</th>
                    <th className="px-4 py-3 text-left">Budget</th>
                    <th className="px-4 py-3 text-left">Teilnehmer</th>
                    <th className="px-4 py-3 text-left">Adressen</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Erstellt</th>
                    <th className="px-4 py-3 text-left">PIN</th>
                    <th className="px-4 py-3 text-left">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr
                      key={group.id}
                      className={`border-b border-gray-700 hover:bg-gray-750 transition ${selectedGroups.has(group.id) ? 'bg-gray-700' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedGroups.has(group.id)}
                          onChange={() => toggleGroupSelection(group.id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-white">{group.name}</p>
                          <p className="text-xs text-gray-400 font-mono truncate">{group.id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{group.budget}</td>
                      <td className="px-4 py-3 text-gray-300 text-center">
                        {group.participants?.length || 0}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-center">
                        {group.participants?.filter(p => p.address)?.length || 0}/{group.participants?.length || 0}
                      </td>
                      <td className="px-4 py-3">
                        {group.drawn ? (
                          <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
                            ✅ Ausgelost
                          </span>
                        ) : (
                          <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs font-semibold">
                            ⏳ Offen
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {formatDate(group.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {group.organizerPin ? (
                          <p className="font-bold text-yellow-300 text-sm tracking-wider">{group.organizerPin}</p>
                        ) : (
                          <p className="text-gray-500 text-xs">-</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <a
                            href={`/organizer/${group.id}`}
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-semibold"
                            title="Organizer Dashboard"
                          >
                            🔐
                          </a>
                          <a
                            href={`/admin/groups/${group.id}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-semibold"
                            title="Details anschauen"
                          >
                            👁️
                          </a>
                          <button
                            onClick={() => handleDeleteGroup(group.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-semibold"
                            title="Einzeln löschen"
                          >
                            🗑️
                          </button>
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
