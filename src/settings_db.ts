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
enum DiscordIdType {
    ROLE = "ROLE",
    CHANNEL = "CHANNEL",
    CATEGORY = "CATEGORY",
    USER = "USER",
    GUILD = "GUILD",
    MESSAGE = "MESSAGE"
}
type DiscordId = { id: string, id_type: DiscordIdType }
type ChannelId = { id: string, id_type: DiscordIdType.CHANNEL }
type RoleId = { id: string, id_type: DiscordIdType.ROLE }
type CategoryId = { id: string, id_type: DiscordIdType.CATEGORY }
type MessageId = { id: string, id_type: DiscordIdType.MESSAGE }
type UserId = { id: string, id_type: DiscordIdType.USER }
type LoggerConfiguration = { channel: ChannelId }
type GameChannelConfiguration = { adminRole: RoleId, category: CategoryId, fwChannel: ChannelId, waitPing: number }
type StreamCountConfiguration = { channel: ChannelId, messageId: MessageId }
type BroadcastConfiguration = { role: RoleId, channel: ChannelId, title_keyword: string }
type TeamConfiguration = { channel: ChannelId, messageId: MessageId, autoUpdate: boolean }
type WaitlistConfiguration = { current_waitlist: UserId[] }
type MaddenLeagueConfiguration = { league_id: string }

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
