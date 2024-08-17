import { ParameterizedContext } from "koa"
import { APIChatInputApplicationCommandInteractionData, APIInteractionGuildMember } from "discord-api-types/payloads"
import { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10"
import leagueExportHandler from "./commands/league_export"
import { createMessageResponse, respond } from "./discord_utils"

export type Command = { command_name: string, token: string, guild_id: string, data: APIChatInputApplicationCommandInteractionData, member: APIInteractionGuildMember }

export interface CommandHandler {
    handleCommand(command: Command, ctx: ParameterizedContext): Promise<void>
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

export async function handleCommand(command: Command, ctx: ParameterizedContext) {
    const commandName = command.command_name
    const handler = SlashCommands[commandName]
    if (handler) {
        await handler.handleCommand(command, ctx)
    } else {
        ctx.status = 200
        respond(ctx, createMessageResponse(`command ${commandName} not implemented`))
    }
}
