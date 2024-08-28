import { ParameterizedContext } from "koa"
import { CommandHandler, Command } from "../commands_handler"
import { respond, createMessageResponse, DiscordClient, deferMessage } from "../discord_utils"
import { APIApplicationCommandInteractionDataChannelOption, APIApplicationCommandInteractionDataRoleOption, APIApplicationCommandInteractionDataStringOption, APIApplicationCommandInteractionDataSubcommandGroupOption, APIApplicationCommandInteractionDataSubcommandOption, APIMessage, ApplicationCommandOptionType, ApplicationCommandType, ChannelType, RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10"
import { Firestore } from "firebase-admin/firestore"
import { DiscordIdType, LeagueSettings, StreamCountConfiguration, UserStreamCount } from "../settings_db"

async function moveStreamCountMessage(client: DiscordClient, oldChannelId: string, oldMessageId: string, newChannelId: string, counts: Array<UserStreamCount>): Promise<string> {
    await client.requestDiscord(`channels/${oldChannelId}/messages/${oldMessageId}`, {
        method: "DELETE"
    })
    const res = await client.requestDiscord(`channels/${newChannelId}/messages/`, {
        method: "POST",
        body: {
            content: createStreamCountMessage(counts),
            allowed_mentions: {
                parse: [],
            },

        }
    })
    const message = await res.json() as APIMessage
    return message.id
}

function createStreamCountMessage(counts: Array<UserStreamCount>) {
    const sortedCountsList = counts.sort((a, b) =>
        a.count > b.count ? -1 : 1
    )
    return (
        "# Streams \n" +
        sortedCountsList
            .map((userCount) => `<@${userCount.user.id}>: ${userCount.count}`)
            .join("\n")
            .trim()
    )
}

export default {
    async handleCommand(command: Command, client: DiscordClient, db: Firestore, ctx: ParameterizedContext) {
        const { guild_id, token } = command
        if (!command.data.options) {
            throw new Error("logger command not defined properly")
        }
        const options = command.data.options
        const streamsCommand = options[0] as APIApplicationCommandInteractionDataSubcommandOption
        const subCommand = streamsCommand.name
        const doc = await db.collection("league_settings").doc(guild_id).get()
        const leagueSettings = doc.exists ? doc.data() as LeagueSettings : {} as LeagueSettings
        if (subCommand === "configure") {
            if (!streamsCommand.options || !streamsCommand.options[0]) {
                throw new Error("streams configure misconfigured")
            }
            const channel = (streamsCommand.options[0] as APIApplicationCommandInteractionDataChannelOption).value
            const oldChannelId = leagueSettings?.commands?.stream_count?.channel?.id
            const counts = leagueSettings?.commands?.stream_count?.counts ?? []
            if (oldChannelId && oldChannelId !== channel) {
                respond(ctx, deferMessage())
                const oldMessage = leagueSettings.commands?.stream_count?.message?.id || ""
                const update = async (newMessageId: string) => {
                    const streamConfiguration = {
                        channel: {
                            id: channel,
                            id_type: DiscordIdType.CHANNEL
                        },
                        counts: counts,
                        message: {
                            id: newMessageId,
                            id_type: DiscordIdType.MESSAGE
                        }
                    } as StreamCountConfiguration
                    await db.collection("league_settings").doc(guild_id).set({
                        commands: {
                            stream_count: streamConfiguration
                        }
                    }, { merge: true })
                    client.editOriginalInteraction(token, {
                        content: "Stream count re configured and moved"
                    })
                }
                moveStreamCountMessage(client, oldChannelId, oldMessage, channel, counts).then(update)
            } else {

                const res = await client.requestDiscord(`/channels/${channel}/messages`, {
                    method: "POST",
                    body: {
                        content: createStreamCountMessage(counts),
                        allowed_mentions: {
                            parse: [],
                        },
                    }
                })
                const messageData = await res.json() as APIMessage
                const streamConfiguration = {
                    channel: {
                        id: channel,
                        id_type: DiscordIdType.CHANNEL
                    },
                    counts: counts,
                    message: {
                        id: messageData.id,
                        id_type: DiscordIdType.MESSAGE
                    }
                } as StreamCountConfiguration
                await db.collection("league_settings").doc(guild_id).set({
                    commands: {
                        stream_count: streamConfiguration
                    }
                }, { merge: true })

                respond(ctx, createMessageResponse("Stream Count configured"))
            }
        } else if (subCommand === "count") {

        } else if (subCommand === "remove") {
        } else if (subCommand === "reset") {
        } else {
            throw new Error(`streams ${subCommand} misconfigured`)
        }
    },
    commandDefinition(): RESTPostAPIApplicationCommandsJSONBody {
        return {
            type: ApplicationCommandType.ChatInput,
            name: "streams",
            description: "streams: configure, count, remove, reset",
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "configure",
                    description: "sets channel",
                    options: [
                        {
                            type: ApplicationCommandOptionType.Channel,
                            name: "channel",
                            description: "channel to send message in",
                            required: true,
                            channel_types: [ChannelType.GuildText],
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "count",
                    description: "ups the stream count by 1, optionally override the count",
                    options: [
                        {
                            type: ApplicationCommandOptionType.User,
                            name: "user",
                            description: "user to count the stream for",
                            required: true,
                        },
                        {
                            type: ApplicationCommandOptionType.Integer,
                            name: "increment",
                            description:
                                "changes the increment from 1 to your choice. can be negative",
                            required: false,
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.Subcommand, // sub command
                    name: "remove",
                    description: "removes the user stream counts",
                    options: [
                        {
                            type: ApplicationCommandOptionType.User,
                            name: "user",
                            description: "user to remove",
                            required: true,
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "reset",
                    description: "DANGER resets all users to 0",
                    options: [],
                },
            ],
        }

    }
} as CommandHandler
