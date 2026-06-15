"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import {
  MessageSquare,
  Copy,
  Check,
  RefreshCw,
  Link as LinkIcon,
  Users,
  Settings,
  Plus,
} from "lucide-react";

interface DiscordInfo {
  discordServerId?: string;
  discordInviteLink?: string;
  isConnected: boolean;
}

export default function DiscordIntegration({
  initialData,
}: {
  initialData: DiscordInfo;
}) {
  const [discordInfo, setDiscordInfo] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [serverIdInput, setServerIdInput] = useState(
    initialData.discordServerId || ""
  );
  const [savingServer, setSavingServer] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  const handleConnect = () => {
    // Use NextAuth's built-in Discord OAuth flow
    signIn("discord", { callbackUrl: "/dashboard?tab=discord" });
  };

  const handleSaveServerId = async () => {
    if (!serverIdInput.trim()) return;
    setSavingServer(true);
    setServerError(null);

    try {
      const res = await fetch("/api/tutors/discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId: serverIdInput.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "Failed to connect server");
        return;
      }

      setDiscordInfo((prev) => ({ ...prev, discordServerId: data.serverId }));
      setAvailableRoles(data.availableRoles || []);
    } catch (err: any) {
      setServerError(err.message || "Something went wrong");
    } finally {
      setSavingServer(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/discord/sync", { method: "POST" });
      const data = await response.json();
      if (response.ok) {
        const synced = data.results?.filter((r: any) => r.status === "synced").length || 0;
        const errors = data.results?.filter((r: any) => r.status === "error").length || 0;
        alert(`Sync complete: ${synced} synced, ${errors} errors.`);
      } else {
        alert(data.error || "Failed to sync roles");
      }
    } catch (err: any) {
      alert(err.message || "Failed to sync roles");
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    if (discordInfo.discordInviteLink) {
      navigator.clipboard.writeText(discordInfo.discordInviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getBotInviteUrl = () => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const permissions = process.env.NEXT_PUBLIC_DISCORD_PERMISSIONS || "2415929347";
    return `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {!discordInfo.isConnected ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#5865F2] to-[#404EED] p-8 text-center">
            <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px]" />
            <div className="relative">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 font-heading">
                Connect Your Discord Account
              </h2>
              <p className="text-white/80 max-w-md mx-auto">
                Link your Discord account so we can manage your server roles
                automatically based on student enrollment.
              </p>
            </div>
          </div>
          <div className="p-8 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 flex-wrap">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Auto-role assignment</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Sync enrollment status</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Real-time updates</span>
                </div>
              </div>
              <button
                onClick={handleConnect}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#5865F2] text-white rounded-xl hover:bg-[#4752C4] transition-all font-semibold shadow-lg"
              >
                <MessageSquare className="w-5 h-5" />
                Connect Discord
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5865F2]/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-[#5865F2]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Discord Integration</h2>
                <p className="text-sm text-gray-500">Manage your Discord server settings</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Server ID input */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-500" />
                <h3 className="font-medium text-gray-900">Your Discord Server</h3>
              </div>

              {!discordInfo.discordServerId ? (
                <>
                  <p className="text-sm text-gray-600">
                    Paste your Discord server (guild) ID below. Make sure the
                    Loran bot has already been invited to that server.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <input
                      type="text"
                      value={serverIdInput}
                      onChange={(e) => setServerIdInput(e.target.value)}
                      placeholder="e.g. 123456789012345678"
                      className="flex-1 min-w-[200px] px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-tutor/40"
                    />
                    <button
                      onClick={handleSaveServerId}
                      disabled={savingServer}
                      className="px-4 py-2 bg-tutor text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      {savingServer ? "Checking..." : "Connect Server"}
                    </button>
                  </div>
                  {serverError && (
                    <p className="text-sm text-red-600">{serverError}</p>
                  )}
                  {availableRoles.length > 0 && (
                    <div className="text-xs text-gray-500">
                      Roles found: {availableRoles.join(", ")}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Server ID</p>
                    <p className="font-mono text-sm text-gray-900 mt-1">
                      {discordInfo.discordServerId}
                    </p>
                  </div>
                  {discordInfo.discordInviteLink && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={copyInviteLink}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-tutor hover:bg-tutor/5 rounded-lg transition"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? "Copied!" : "Copy Invite"}
                      </button>
                      <a
                        href={discordInfo.discordInviteLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition"
                      >
                        <LinkIcon className="w-4 h-4" />
                        Join Server
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bot Integration Guide */}
            <div className="bg-gradient-to-br from-[#5865F2]/5 to-[#404EED]/5 rounded-xl p-6 border border-[#5865F2]/20">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#5865F2]" />
                Bot Integration Guide
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#5865F2]/20 text-[#5865F2] flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                  <p className="text-sm text-gray-700">Invite the Loran bot to your server using the link below</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#5865F2]/20 text-[#5865F2] flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                  <p className="text-sm text-gray-700">
                    Make sure your server has roles named exactly: <strong>Tutor - [Subject]</strong>,{" "}
                    <strong>[Subject] Student</strong>, plan roles (Trial, 3 Months, 6 Months, 1 Year Diploma), and Expired
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#5865F2]/20 text-[#5865F2] flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                  <p className="text-sm text-gray-700">Paste your server ID above and click Connect Server</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#5865F2]/20 text-[#5865F2] flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
                  <p className="text-sm text-gray-700">Click "Sync Student Roles Now" to assign roles to enrolled students</p>
                </div>
              </div>
              <div className="mt-4">
                <a
                  href={getBotInviteUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Invite Bot to Server
                </a>
              </div>
            </div>

            {/* Sync Button */}
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                onClick={handleSync}
                disabled={loading || !discordInfo.discordServerId}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-tutor to-brand-primary text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Syncing..." : "Sync Student Roles Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}