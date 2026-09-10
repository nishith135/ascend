import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import HunterCardModal from '../components/HunterCardModal';

const RANK_COLORS = {
  E: 'text-slate-400 bg-slate-900/50 border-slate-700',
  D: 'text-stone-400 bg-stone-900/50 border-stone-700',
  C: 'text-emerald-400 bg-emerald-950/50 border-emerald-700',
  B: 'text-blue-400 bg-blue-950/50 border-blue-700',
  A: 'text-violet-400 bg-violet-950/50 border-violet-700',
  S: 'text-amber-300 bg-amber-950/50 border-amber-600',
};

export default function SocialPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' | 'friends'

  // Leaderboard state
  const [scope, setScope] = useState('global'); // 'global' | 'friends'
  const [timeframe, setTimeframe] = useState('weekly'); // 'weekly' | 'all_time'
  const [leaderboard, setLeaderboard] = useState(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  // Friends state
  const [friendsData, setFriendsData] = useState({ friends: [], incoming: [], outgoing: [] });
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Hunter Card Modal state
  const [inspectedHunter, setInspectedHunter] = useState(null);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoadingLeaderboard(true);
      const data = await api.getLeaderboard(scope, timeframe);
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [scope, timeframe]);

  // Fetch friends
  const fetchFriends = useCallback(async () => {
    try {
      setLoadingFriends(true);
      const data = await api.getFriends();
      setFriendsData(data);
    } catch (err) {
      console.error('Failed to load friends:', err);
    } finally {
      setLoadingFriends(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    } else {
      fetchFriends();
    }
  }, [activeTab, fetchLeaderboard, fetchFriends]);

  // User search
  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await api.searchUsers(q);
      setSearchResults(results);
    } catch (err) {
      console.error('Failed to search hunters:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSendFriendRequest = async (username) => {
    try {
      const res = await api.sendFriendRequest(username);
      setActionMessage(res.detail || 'Request sent!');
      setTimeout(() => setActionMessage(''), 3000);
      fetchFriends();
      // refresh search list state
      if (searchQuery) {
        const results = await api.searchUsers(searchQuery);
        setSearchResults(results);
      }
    } catch (err) {
      setActionMessage(err.message || 'Failed to send request');
      setTimeout(() => setActionMessage(''), 3000);
    }
  };

  const handleRespondFriendRequest = async (friendshipId, action) => {
    try {
      await api.respondFriendRequest(friendshipId, action);
      fetchFriends();
    } catch (err) {
      console.error('Failed to respond to request:', err);
    }
  };

  const handleRemoveFriend = async (userId) => {
    if (!window.confirm('Remove this hunter from your Guild Network?')) return;
    try {
      await api.removeFriend(userId);
      fetchFriends();
    } catch (err) {
      console.error('Failed to remove friend:', err);
    }
  };

  const top3 = leaderboard?.entries?.slice(0, 3) || [];

  return (
    <div className="space-y-panel-gap flex flex-col pb-6">

      {/* Header Banner */}
      <section className="glass-panel rounded-xl p-4 flex justify-between items-center">
        <div>
          <span className="font-label-system text-[10px] text-tertiary tracking-widest uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
            HUNTER ASSOCIATION
          </span>
          <h2 className="font-category-header text-xl text-primary font-bold tracking-wide mt-0.5">
            Guild Hall & Rankings
          </h2>
        </div>

        {/* View My License Button */}
        <button
          onClick={() => setInspectedHunter(user)}
          className="monarch-btn px-3 py-1.5 rounded-lg text-xs font-mono text-primary flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[15px]">badge</span>
          MY LICENSE
        </button>
      </section>

      {/* Primary Tab Switcher */}
      <div className="flex bg-surface-container/60 p-1 rounded-xl border border-primary-container/20 font-mono text-xs">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${activeTab === 'leaderboard' ? 'bg-primary-container/30 text-primary border border-primary-container/40 font-bold shadow-[0_0_10px_rgba(225,29,72,0.3)]' : 'text-on-surface-variant hover:text-white'}`}
        >
          <span className="material-symbols-outlined text-[16px]">military_tech</span>
          GUILD LEADERBOARD
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all relative ${activeTab === 'friends' ? 'bg-primary-container/30 text-primary border border-primary-container/40 font-bold shadow-[0_0_10px_rgba(225,29,72,0.3)]' : 'text-on-surface-variant hover:text-white'}`}
        >
          <span className="material-symbols-outlined text-[16px]">groups</span>
          HUNTER NETWORK
          {friendsData.incoming.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-primary-container animate-ping ml-1"></span>
          )}
        </button>
      </div>

      {actionMessage && (
        <div className="bg-primary-container/20 border border-primary-container text-primary font-mono text-xs p-3 rounded-lg text-center animate-in">
          {actionMessage}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: LEADERBOARD                                                      */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          {/* Subfilters */}
          <div className="flex flex-wrap justify-between items-center gap-2 font-mono text-xs">
            {/* Scope Filter: Global vs Friends */}
            <div className="flex bg-surface-container/40 p-1 rounded-lg border border-primary-container/10">
              <button
                onClick={() => setScope('global')}
                className={`px-3 py-1 rounded transition-all ${scope === 'global' ? 'bg-primary-container/20 text-primary font-bold' : 'text-on-surface-variant'}`}
              >
                GLOBAL
              </button>
              <button
                onClick={() => setScope('friends')}
                className={`px-3 py-1 rounded transition-all ${scope === 'friends' ? 'bg-primary-container/20 text-primary font-bold' : 'text-on-surface-variant'}`}
              >
                FRIENDS ONLY
              </button>
            </div>

            {/* Timeframe Filter: Weekly vs All-Time */}
            <div className="flex bg-surface-container/40 p-1 rounded-lg border border-primary-container/10">
              <button
                onClick={() => setTimeframe('weekly')}
                className={`px-3 py-1 rounded transition-all ${timeframe === 'weekly' ? 'bg-tertiary/20 text-tertiary font-bold' : 'text-on-surface-variant'}`}
              >
                WEEKLY RAIDS
              </button>
              <button
                onClick={() => setTimeframe('all_time')}
                className={`px-3 py-1 rounded transition-all ${timeframe === 'all_time' ? 'bg-tertiary/20 text-tertiary font-bold' : 'text-on-surface-variant'}`}
              >
                ALL-TIME
              </button>
            </div>
          </div>

          {loadingLeaderboard ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="w-8 h-8 border-4 border-monarch-crimson border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* TOP 3 PODIUM */}
              {top3.length > 0 && (
                <div className="glass-panel rounded-xl p-4 border border-primary-container/30">
                  <div className="text-[10px] font-mono text-on-surface-variant tracking-wider uppercase text-center mb-3">
                    ELITE TOP HUNTERS
                  </div>

                  <div className="flex justify-center items-end gap-2 sm:gap-4 pt-4 pb-2">
                    {/* #2 Rank (Silver) */}
                    {top3[1] && (
                      <div
                        onClick={() => setInspectedHunter(top3[1])}
                        className="flex-1 flex flex-col items-center cursor-pointer transition-transform hover:scale-105"
                      >
                        <div className="w-12 h-12 rounded-full border-2 border-slate-300 bg-surface-container-high flex items-center justify-center font-bold text-slate-200 text-lg shadow-[0_0_15px_rgba(203,213,225,0.4)]">
                          {top3[1].username.charAt(0).toUpperCase()}
                        </div>
                        <div className="bg-slate-300/20 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold mt-1">
                          #2 SILVER
                        </div>
                        <span className="font-mono text-xs text-slate-200 font-bold mt-1 truncate max-w-[80px]">
                          {top3[1].username}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {top3[1].xp.toLocaleString()} XP
                        </span>
                      </div>
                    )}

                    {/* #1 Rank (Gold - Monarch) */}
                    {top3[0] && (
                      <div
                        onClick={() => setInspectedHunter(top3[0])}
                        className="flex-1 flex flex-col items-center cursor-pointer transition-transform hover:scale-105 -translate-y-2"
                      >
                        <div className="relative">
                          <span className="material-symbols-outlined text-amber-400 text-2xl absolute -top-5 left-1/2 -translate-x-1/2 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">
                            crown
                          </span>
                          <div className="w-16 h-16 rounded-full border-2 border-amber-400 bg-amber-950/40 flex items-center justify-center font-black text-amber-300 text-2xl shadow-[0_0_20px_rgba(251,191,36,0.6)]">
                            {top3[0].username.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold mt-1 shadow">
                          #1 MONARCH
                        </div>
                        <span className="font-mono text-sm text-amber-200 font-bold mt-1 truncate max-w-[90px]">
                          {top3[0].username}
                        </span>
                        <span className="font-mono text-xs text-amber-400 font-bold">
                          {top3[0].xp.toLocaleString()} XP
                        </span>
                      </div>
                    )}

                    {/* #3 Rank (Bronze) */}
                    {top3[2] && (
                      <div
                        onClick={() => setInspectedHunter(top3[2])}
                        className="flex-1 flex flex-col items-center cursor-pointer transition-transform hover:scale-105"
                      >
                        <div className="w-12 h-12 rounded-full border-2 border-amber-700 bg-surface-container-high flex items-center justify-center font-bold text-amber-600 text-lg shadow-[0_0_15px_rgba(180,83,9,0.3)]">
                          {top3[2].username.charAt(0).toUpperCase()}
                        </div>
                        <div className="bg-amber-700/20 text-amber-500 px-2 py-0.5 rounded text-[10px] font-mono font-bold mt-1">
                          #3 BRONZE
                        </div>
                        <span className="font-mono text-xs text-amber-500 font-bold mt-1 truncate max-w-[80px]">
                          {top3[2].username}
                        </span>
                        <span className="font-mono text-[10px] text-amber-600">
                          {top3[2].xp.toLocaleString()} XP
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* REST OF RANKINGS TABLE */}
              <div className="glass-panel rounded-xl p-3 border border-primary-container/20">
                <div className="space-y-2">
                  {leaderboard?.entries?.map((entry) => {
                    const rankStyle = RANK_COLORS[entry.rank] || RANK_COLORS['E'];
                    const isSelf = entry.is_self;

                    return (
                      <div
                        key={entry.user_id}
                        onClick={() => setInspectedHunter(entry)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                          isSelf
                            ? 'bg-primary-container/20 border-primary-container shadow-[0_0_12px_rgba(225,29,72,0.3)]'
                            : 'bg-surface-container/50 border-primary-container/10 hover:border-primary-container/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono text-xs font-bold text-on-surface-variant w-6 text-center">
                            #{entry.rank_number}
                          </span>

                          <div className="w-9 h-9 rounded-full bg-surface-container-high border border-primary-container/30 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                            {entry.username.charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-sm text-primary font-bold truncate">
                                {entry.username}
                              </span>
                              {isSelf && (
                                <span className="text-[9px] font-mono bg-primary-container text-white px-1.5 py-0.2 rounded font-bold">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-on-surface-variant flex items-center gap-1">
                              <span>Lv.{entry.level}</span>
                              <span>•</span>
                              <span className="flex items-center text-orange-400">
                                <span className="material-symbols-outlined text-[12px]">local_fire_department</span>
                                {entry.current_streak}d
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${rankStyle}`}>
                            {entry.rank}
                          </span>
                          <span className="font-mono text-xs font-bold text-primary min-w-[65px] text-right">
                            {entry.xp.toLocaleString()} XP
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {leaderboard?.entries?.length === 0 && (
                    <div className="text-center py-8 font-mono text-xs text-on-surface-variant">
                      No hunters registered in this bracket yet.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: HUNTER NETWORK & RECRUITMENT                                    */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'friends' && (
        <div className="space-y-4 font-mono text-xs">

          {/* Search / Add Hunters */}
          <div className="glass-panel rounded-xl p-4 border border-primary-container/20">
            <h3 className="text-xs text-primary font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">person_search</span>
              Recruit Fellow Hunters
            </h3>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search hunter by username..."
                className="w-full hud-input rounded-lg pl-9 pr-3 py-2 text-primary text-xs"
              />
              <span className={`material-symbols-outlined absolute left-2.5 top-2.5 text-on-surface-variant text-[18px] ${searching ? 'animate-spin text-primary' : ''}`}>
                {searching ? 'sync' : 'search'}
              </span>
            </div>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="mt-3 space-y-2 border-t border-primary-container/20 pt-3">
                {searchResults.map((h) => (
                  <div key={h.id} className="flex justify-between items-center p-2 rounded bg-surface-container/60 border border-primary-container/20">
                    <div>
                      <div className="font-bold text-primary">{h.username}</div>
                      <div className="text-[10px] text-on-surface-variant">
                        Lv.{h.level} • {h.rank}-Rank
                      </div>
                    </div>

                    {h.friendship_status === 'none' && (
                      <button
                        onClick={() => handleSendFriendRequest(h.username)}
                        className="monarch-btn px-2.5 py-1 rounded text-primary text-[11px]"
                      >
                        + ADD FRIEND
                      </button>
                    )}
                    {h.friendship_status === 'pending_outgoing' && (
                      <span className="text-[10px] text-amber-400">PENDING...</span>
                    )}
                    {h.friendship_status === 'friends' && (
                      <span className="text-[10px] text-tertiary">FRIENDS ✓</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Incoming Requests */}
          {friendsData.incoming.length > 0 && (
            <div className="glass-panel rounded-xl p-4 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <h3 className="text-xs text-amber-300 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">mail</span>
                Pending Guild Invitations ({friendsData.incoming.length})
              </h3>

              <div className="space-y-2">
                {friendsData.incoming.map((req) => (
                  <div key={req.id} className="flex justify-between items-center p-2.5 rounded-lg bg-surface-container/70 border border-amber-500/30">
                    <div>
                      <div className="font-bold text-amber-200">{req.from_user.username}</div>
                      <div className="text-[10px] text-on-surface-variant">
                        Lv.{req.from_user.level} • {req.from_user.rank}-Rank Hunter
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleRespondFriendRequest(req.id, 'accept')}
                        className="bg-emerald-600/30 border border-emerald-500 text-emerald-300 px-2.5 py-1 rounded text-[11px] hover:bg-emerald-600/50"
                      >
                        ACCEPT
                      </button>
                      <button
                        onClick={() => handleRespondFriendRequest(req.id, 'decline')}
                        className="bg-red-950 border border-red-800 text-red-400 px-2 py-1 rounded text-[11px]"
                      >
                        DECLINE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends List */}
          <div className="glass-panel rounded-xl p-4 border border-primary-container/20">
            <h3 className="text-xs text-primary font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">group</span>
              Registered Allies ({friendsData.friends.length})
            </h3>

            {loadingFriends ? (
              <div className="text-center py-6">
                <div className="w-6 h-6 border-2 border-monarch-crimson border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {friendsData.friends.map((f) => {
                  const rankStyle = RANK_COLORS[f.rank] || RANK_COLORS['E'];

                  return (
                    <div
                      key={f.id}
                      className="flex justify-between items-center p-2.5 rounded-lg bg-surface-container/50 border border-primary-container/15"
                    >
                      <div
                        onClick={() => setInspectedHunter(f)}
                        className="flex items-center gap-3 cursor-pointer min-w-0"
                      >
                        <div className="w-9 h-9 rounded-full bg-surface-container-high border border-primary-container/30 flex items-center justify-center font-bold text-primary flex-shrink-0">
                          {f.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-primary truncate hover:underline">
                            {f.username}
                          </div>
                          <div className="text-[10px] text-on-surface-variant flex items-center gap-1.5">
                            <span>Lv.{f.level}</span>
                            <span className={`px-1 rounded border text-[9px] ${rankStyle}`}>{f.rank}-Rank</span>
                            <span className="text-orange-400">{f.current_streak}d</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setInspectedHunter(f)}
                          className="monarch-btn px-2 py-1 rounded text-[10px] text-primary"
                          title="View Hunter License"
                        >
                          LICENSE
                        </button>
                        <button
                          onClick={() => handleRemoveFriend(f.id)}
                          className="text-on-surface-variant hover:text-red-400 p-1"
                          title="Remove Friend"
                        >
                          <span className="material-symbols-outlined text-[16px]">person_remove</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {friendsData.friends.length === 0 && (
                  <div className="text-center py-6 text-on-surface-variant text-xs">
                    No hunters in your network yet. Use the search bar above to recruit allies!
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* HUNTER CARD INSPECTION MODAL */}
      {inspectedHunter && (
        <HunterCardModal
          hunter={inspectedHunter}
          onClose={() => setInspectedHunter(null)}
        />
      )}

    </div>
  );
}
