import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getGroup, saveGroup } from '../../../lib/kv-client';
import { getPostDrawShareText } from '../../../lib/constants';

// Force SSR to prevent static generation errors
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

export default function DrawPage() {
  const router = useRouter();
  const { id } = router.query;
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      loadGroup();
    }
  }, [id]);

  const loadGroup = async () => {
    try {
      // Try KV first (primary)
      let groupData = null;
      try {
        groupData = await getGroup(id);
        if (groupData) {
          console.log('✅ Group loaded from KV');
        }
      } catch (kvErr) {
        console.log('KV not available, trying API:', kvErr);
      }

      // Fallback to API
      if (!groupData) {
        try {
          const response = await fetch(`/api/groups/list?groupId=${id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.groups && data.groups.length > 0) {
              groupData = data.groups[0];
              console.log('✅ Group loaded from API');
            }
          }
        } catch (apiErr) {
          console.error('API not available:', apiErr);
        }
      }

      if (groupData) {
        setGroup(groupData);
      } else {
        setError('Fehler beim Laden der Gruppe');
      }
    } catch (err) {
      console.error('Error loading group:', err);
      setError('Fehler beim Laden der Gruppe');
    } finally {
      setLoading(false);
    }
  };

  const performDraw = async () => {
    if (!window.confirm('⚠️ WARNUNG: Das Auslosen kann NICHT rückgängig gemacht werden! Sicher fortfahren?')) {
      return;
    }

    setDrawing(true);
    setError('');

    try {
      const response = await fetch(`/api/draw/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Auslosung fehlgeschlagen');
      }

      const data = await response.json();

      // Update local state (no need to save to localStorage - KV was updated by API)
      const updatedGroup = {
        ...group,
        drawn: true,
        pairing: data.pairing,
        drawnAt: new Date().toISOString(),
      };

      setGroup(updatedGroup);

      // Store the pairings share link for the dashboard
      if (data.pairingsShareLink) {
        localStorage.setItem(`drawSuccess_${id}`, data.pairingsShareLink);
      }

      setSuccess(true);

      // Redirect to dashboard with success popup after 1 second
      setTimeout(() => {
        router.push(`/organizer/${id}?drawSuccess=true`);
      }, 1000);
    } catch (err) {
      console.error('Error performing draw:', err);
      setError(err.message || 'Fehler beim Auslosen');
    } finally {
      setDrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50 flex items-center justify-center">
        <p className="text-2xl text-gray-600">🔄 Lädt...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-gray-900 mb-4">❌ Gruppe nicht gefunden</p>
          <Link href="/" className="text-blue-600 hover:underline">
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    // Redirect to dashboard - don't show anything
    return null;
  }

  // Show confirmation screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
      <div className="container mx-auto py-12 px-4 max-w-2xl">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h1 className="text-4xl font-bold mb-6 text-center">🎲 Auslosung starten</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              ❌ Fehler: {error}
            </div>
          )}

          {/* Group Info */}
          <div className="text-center mb-8">
            <p className="text-gray-600 text-sm font-semibold mb-2">Gruppe</p>
            <p className="text-3xl font-bold text-gray-900 mb-4">{group.name}</p>
            <p className="text-gray-700"><span className="font-semibold">{group.participants?.length || 0}</span> Teilnehmer</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <Link href={`/organizer/${id}`} className="flex-1 btn-outline text-center">
              ← Zurück
            </Link>
            <button
              onClick={performDraw}
              disabled={drawing}
              className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
            >
              {drawing ? '🔄 Wird ausgelost...' : '🎲 Jetzt auslosen!'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
