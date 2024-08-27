import { ParameterizedContext } from "koa"
import { CommandHandler, Command } from "../commands_handler"
import { respond, createMessageResponse, DiscordClient } from "../discord_utils"
import { APIApplicationCommandInteractionDataChannelOption, APIApplicationCommandInteractionDataRoleOption, APIApplicationCommandInteractionDataStringOption, APIApplicationCommandInteractionDataSubcommandGroupOption, APIApplicationCommandInteractionDataSubcommandOption, APIApplicationCommandStringOption, APIApplicationCommandSubcommandGroupOption, APIApplicationCommandSubcommandOption, ApplicationCommandOptionType, ApplicationCommandType, ChannelType, RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10"
import { Firestore } from "firebase-admin/firestore"
import { LeagueSettings, BroadcastConfiguration, DiscordIdType } from "../settings_db"

export default {
    async handleCommand(command: Command, client: DiscordClient, db: Firestore, ctx: ParameterizedContext) {
        const { guild_id } = command
        const doc = await db.collection("league_settings").doc(guild_id).get()
        const leagueSettings = doc.exists ? doc.data() as LeagueSettings : {} as LeagueSettings
        if (!command.data.options) {
            throw new Error("misconfigured waitlist")
        }
        const subCommand = command.data.options[0] as APIApplicationCommandInteractionDataSubcommandOption | APIApplicationCommandInteractionDataSubcommandGroupOption
        const subCommandName = subCommand.name
        if (subCommandName === "configure") {
            const configureCommand = subCommand as APIApplicationCommandInteractionDataSubcommandOption
            if (!configureCommand.options) {
                throw new Error("misconfigued broadcast configure")
            }
            const titleKeyword = (configureCommand.options[0] as APIApplicationCommandInteractionDataStringOption).value
            const channel = (configureCommand.options[1] as APIApplicationCommandInteractionDataChannelOption).value
            const role = (configureCommand.options?.[2] as APIApplicationCommandInteractionDataRoleOption)?.value
            const conf = {
                title_keyword: titleKeyword,
                channel: { id: channel, id_type: DiscordIdType.CHANNEL },
            } as BroadcastConfiguration
            if (role) {
                conf.role = { id: role, id_type: DiscordIdType.ROLE }
            }
            await db.collection("league_settings").doc(guild_id).set({
                commands: {
                    broadcast: conf
                }
            }, { merge: true })
            respond(ctx, createMessageResponse("Broadcast is configured!"))
        } else if (subCommandName === "youtube") {
            const subCommandGroup = subCommand as APIApplicationCommandInteractionDataSubcommandGroupOption
            if (!subCommandGroup || !subCommandGroup.options) {
                throw new Error("youtube command misconfigured")
            }
            const groupCommand = subCommandGroup.options[0] as APIApplicationCommandInteractionDataSubcommandOption
            // if (groupCommand)	
        } else if (subCommandName === "twitch") {
        } else {
            throw new Error(`Broadcast SubCommand ${subCommandName} misconfigured`)
        }
    },
    commandDefinition(): RESTPostAPIApplicationCommandsJSONBody {
        return {
            name: "broadcasts",
            description: "sets up your league to start receiving twitch and youtube broadcasts",
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "configure",
                    description: "configures snallabot broadcaster",
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: "keyword",
                            description: "only show broadcasts with this keyword in the title",
                            required: true,
                        },
                        {
                            type: ApplicationCommandOptionType.Channel,
                            name: "channel",
                            description: "channel to send broadcasts to",
                            required: true,
                            channel_types: [ChannelType.GuildText],
                        },
                        {
                            type: ApplicationCommandOptionType.Role,
                            name: "notifier_role",
                            description: "optional role to notify on every broadcast",
                            required: false,
                        },
                    ]
                },
                {
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    name: "youtube",
                    description: "configures youtube broadcasts",
                    options: [
                        {
                            type: ApplicationCommandOptionType.Subcommand,
                            name: "add",
                            description: "add youtube broadcast",
                            options: [
                                {
                                    type: ApplicationCommandOptionType.String,
                                    name: "youtube_channel",
                                    description:
                                        "the full youtube channel URL you want to show broadcasts for",
                                    required: true,
                                },
                            ],
                        },
                        {
                            type: ApplicationCommandOptionType.Subcommand,
                            name: "remove",
                            description: "remove youtube broadcast",
                            options: [
                                {
                                    type: ApplicationCommandOptionType.String,
                                    name: "youtube_channel",
                                    description: "the youtube channel you want to remove",
                                    required: true,
                                },
                            ],
                        },
                        {
                            type: ApplicationCommandOptionType.Subcommand,
                            name: "list",
                            description: "list all youtube broadcast",
                            options: [],
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    name: "twitch",
                    description: "configures twitch broadcasts",
                    options: [
                        {
                            type: ApplicationCommandOptionType.Subcommand,
                            name: "add",
                            description: "add twitch broadcast",
                            options: [
                                {
                                    type: ApplicationCommandOptionType.String,
                                    name: "twitch_channel",
                                    description: "the twitch channel you want to show broadcasts for",
                                    required: true,
                                },
                            ],
                        },
                        {
                            type: ApplicationCommandOptionType.Subcommand,
                            name: "remove",
                            description: "remove twitch broadcast",
                            options: [
                                {
                                    type: ApplicationCommandOptionType.String,
                                    name: "twitch_channel",
                                    description: "the twitch channel you want to remove",
                                    required: true,
                                },
                            ],
                        },
                        {
                            type: ApplicationCommandOptionType.Subcommand,
                            name: "list",
                            description: "list all twitch broadcast",
                            options: [],
                        },
                    ],
                },
            ]
        }
    }
} as CommandHandler
