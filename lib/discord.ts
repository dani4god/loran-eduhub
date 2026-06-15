// lib/discord.ts
const DISCORD_API = 'https://discord.com/api/v10'
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!

async function discordRequest(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${DISCORD_API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Discord API error (${res.status}): ${body}`)
  }

  if (res.status === 204) return null
  return res.json()
}

// --- Server (Guild) info ---
export async function getGuild(guildId: string) {
  return discordRequest(`/guilds/${guildId}`)
}

export async function getGuildRoles(guildId: string) {
  return discordRequest(`/guilds/${guildId}/roles`)
}

// --- Member management ---
export async function addMemberToGuild(
  guildId: string,
  userId: string,
  accessToken: string
) {
  return discordRequest(`/guilds/${guildId}/members/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ access_token: accessToken }),
  })
}

export async function getGuildMember(guildId: string, userId: string) {
  try {
    return await discordRequest(`/guilds/${guildId}/members/${userId}`)
  } catch {
    return null
  }
}

// --- Role management ---
export async function addRoleToMember(
  guildId: string,
  userId: string,
  roleId: string
) {
  return discordRequest(
    `/guilds/${guildId}/members/${userId}/roles/${roleId}`,
    { method: 'PUT' }
  )
}

export async function removeRoleFromMember(
  guildId: string,
  userId: string,
  roleId: string
) {
  return discordRequest(
    `/guilds/${guildId}/members/${userId}/roles/${roleId}`,
    { method: 'DELETE' }
  )
}

// --- Invites ---
export async function createInvite(channelId: string, maxAge = 0, maxUses = 0) {
  return discordRequest(`/channels/${channelId}/invites`, {
    method: 'POST',
    body: JSON.stringify({
      max_age: maxAge,
      max_uses: maxUses,
      unique: true,
    }),
  })
}

// --- Bot's guilds ---
export async function getBotGuilds() {
  return discordRequest('/users/@me/guilds')
}