import { ParameterizedContext } from "koa"
import { APIChatInputApplicationCommandInteractionData, APIInteractionGuildMember } from "discord-api-types/payloads"
import { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10"
import leagueExportHandler from "./commands/league_export"
import { createMessageResponse, respond, DiscordClient } from "./discord_utils"
import { Firestore } from "firebase-admin/firestore"

export type Command = { command_name: string, token: string, guild_id: string, data: APIChatInputApplicationCommandInteractionData, member: APIInteractionGuildMember }

export interface CommandHandler {
    handleCommand(command: Command, client: DiscordClient, db: Firestore, ctx: ParameterizedContext): Promise<void>
    commandDefinition(): RESTPostAPIApplicationCommandsJSONBody
}

export type CommandsHandler = { [key: string]: CommandHandler | undefined }

const SlashCommands = {
    "league_export": leagueExportHandler,
    "dashboard": undefined,
    "game_channels": undefined,
    "teams": undefined,
    "streams": undefined,
    "waitlist": undefined,
    "schedule": undefined,
    "logger": undefined,
    "export": undefined,
    "test": undefined
} as CommandsHandler

export async function handleCommand(command: Command, ctx: ParameterizedContext, discordClient: DiscordClient, db: Firestore) {
    const commandName = command.command_name
    const handler = SlashCommands[commandName]
    if (handler) {
        await handler.handleCommand(command, discordClient, db, ctx)
    } else {
        ctx.status = 200
        respond(ctx, createMessageResponse(`command ${commandName} not implemented`))
    }
}
