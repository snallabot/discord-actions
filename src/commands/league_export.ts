import { ParameterizedContext } from "koa"
import { CommandHandler, Command } from "../commands_handler"
import { respond, createMessageResponse } from "../discord_utils"
import { ApplicationCommandType, RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10"

export default {
    async handleCommand(command: Command, ctx: ParameterizedContext) {
        const { guild_id } = command
        respond(ctx, createMessageResponse(`Type this URL carefully into your app (no spaces exactly as shown here): https://snallabot.herokuapp.com/${guild_id}`))
    },
    commandDefinition(): RESTPostAPIApplicationCommandsJSONBody {
        return {
            name: "league_export",
            description: "retrieve the Madden Companion App exporter url",
            type: ApplicationCommandType.ChatInput,
        }
    }
} as CommandHandler
