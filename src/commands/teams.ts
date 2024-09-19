import { ParameterizedContext } from "koa"
import { CommandHandler, Command } from "../commands_handler"
import { respond, createMessageResponse, DiscordClient } from "../discord_utils"
import { APIApplicationCommandInteractionDataBooleanOption, APIApplicationCommandInteractionDataChannelOption, APIApplicationCommandInteractionDataSubcommandOption, ApplicationCommandOptionType, ApplicationCommandType, ChannelType, RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10"
import { Firestore } from "firebase-admin/firestore"

export default {
    async handleCommand(command: Command, client: DiscordClient, db: Firestore, ctx: ParameterizedContext) {
        const { guild_id } = command

    },
    commandDefinition(): RESTPostAPIApplicationCommandsJSONBody {
        return {
            name: "teams",
            description: "Sets up Snallabot teams that will display the current teams in your league with the members the teams are assigned to. Commands: assign, free, configure, reset",
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "assign",
                    description: "assign a discord user to the specified team",
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: "team",
                            description:
                                "the team city, name, or abbreviation. Ex: Buccaneers, TB, Tampa Bay",
                            required: true,
                        },
                        {
                            type: ApplicationCommandOptionType.User,
                            name: "user",
                            description: "user",
                            required: true,
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "free",
                    description: "remove the user assigned to this team, making the team open",
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: "team",
                            description:
                                "the team city, name, or abbreviation. Ex: Buccaneers, TB, Tampa Bay",
                            required: true,
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "configure",
                    description: "sets channel that will display all the teams and the members assigned to them",
                    options: [
                        {
                            type: ApplicationCommandOptionType.Channel,
                            name: "channel",
                            description: "channel to display your teams in",
                            required: true,
                            channel_types: [ChannelType.GuildText],
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "reset",
                    description: "resets all teams assignments making them all open",
                    options: [],
                },
            ],
            type: 1,
        }
    }
} as CommandHandler
