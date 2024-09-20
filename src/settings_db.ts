import { initializeApp, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

export function setupFirebase() {
    // production, use firebase with SA credentials passed from environment
    if (process.env.SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT)
        initializeApp({
            credential: cert(serviceAccount)
        })

    }
    // dev, use firebase emulator
    else {
        if (!process.env.FIRESTORE_EMULATOR_HOST) {
            throw new Error("Firestore emulator is not running!")
        }
        initializeApp({ projectId: "dev" })
    }
    return getFirestore()
}
export enum DiscordIdType {
    ROLE = "ROLE",
    CHANNEL = "CHANNEL",
    CATEGORY = "CATEGORY",
    USER = "USER",
    GUILD = "GUILD",
    MESSAGE = "MESSAGE"
}
type DiscordId = { id: string, id_type: DiscordIdType }
export type ChannelId = { id: string, id_type: DiscordIdType.CHANNEL }
export type RoleId = { id: string, id_type: DiscordIdType.ROLE }
export type CategoryId = { id: string, id_type: DiscordIdType.CATEGORY }
export type MessageId = { id: string, id_type: DiscordIdType.MESSAGE }
export type UserId = { id: string, id_type: DiscordIdType.USER }
export type LoggerConfiguration = { channel: ChannelId }
export type GameChannelConfiguration = { adminRole: RoleId, category: CategoryId, fwChannel: ChannelId, waitPing: number }
export type UserStreamCount = { user: UserId, count: number }
export type StreamCountConfiguration = { channel: ChannelId, message: MessageId, counts: Array<UserStreamCount> }
export type BroadcastConfiguration = { role?: RoleId, channel: ChannelId, title_keyword: string }
export type TeamAssignment = { discord_user?: UserId, discord_role?: RoleId }
export type TeamAssignments = { [key: string]: TeamAssignment }
export type TeamConfiguration = { channel: ChannelId, messageId: MessageId, useRoleUpdates: boolean, assignments: TeamAssignments }
export type WaitlistConfiguration = { current_waitlist: UserId[] }
export type MaddenLeagueConfiguration = { league_id: string }

export type LeagueSettings = {
    commands: {
        logger?: LoggerConfiguration,
        game_channel?: GameChannelConfiguration,
        stream_count?: StreamCountConfiguration,
        broadcast?: BroadcastConfiguration,
        teams?: TeamConfiguration,
        waitlist?: WaitlistConfiguration,
        madden_league?: MaddenLeagueConfiguration
    }
}
