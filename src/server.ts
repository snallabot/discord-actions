import Koa, { ParameterizedContext } from "koa"
import Router from "@koa/router"
import bodyParser from "@koa/bodyparser"
import { requestDiscord, discordInteractionVerifier } from "./discord_utils"
import { APIInteraction, InteractionType, InteractionResponseType, APIChatInputApplicationCommandGuildInteraction } from "discord-api-types/payloads"
import { handleCommand } from "./commands_handler"

const app = new Koa()
const router = new Router()


type MaddenBroadcast = { key: string, event_type: "MADDEN_BROADCAST", delivery: "EVENT_SOURCE", title: string, video: string }
type BroadcastConfiguration = { channel_id: string, role?: string, id: string, timestamp: string }
type BroadcastConfigurationEvents = { "BROADCAST_CONFIGURATION": Array<BroadcastConfiguration> }
if (!process.env.PUBLIC_KEY) {
    throw new Error("No Public Key passed for interaction verification")
}
if (!process.env.TEST_PUBLIC_KEY) {
    throw new Error("No Test Public Key passed for interaction verification")
}

const prodBotVerifier = discordInteractionVerifier(process.env.PUBLIC_KEY)
const testBotVerifier = discordInteractionVerifier(process.env.TEST_PUBLIC_KEY)

async function handleInteraction(ctx: ParameterizedContext, verifier: (ctx: ParameterizedContext) => Promise<boolean>) {
    const verified = await verifier(ctx)
    if (!verified) {
        ctx.status = 401
        return
    }
    const interaction = ctx.request.body as APIInteraction
    const { type: interactionType } = interaction
    if (interactionType === InteractionType.Ping) {
        ctx.status = 200
        ctx.body = { type: InteractionResponseType.Pong }
        return
    }
    if (interactionType === InteractionType.ApplicationCommand) {
        const slashCommandInteraction = interaction as APIChatInputApplicationCommandGuildInteraction
        const { token, guild_id, data, member } = slashCommandInteraction
        const { name } = data
        await handleCommand({ command_name: name, token, guild_id, data, member }, ctx)
        return
    }
    // anything else fail the command
    ctx.status = 404
}

router.post("/sendBroadcast", async (ctx) => {
    const broadcastEvent = ctx.request.body as MaddenBroadcast
    const discordServer = broadcastEvent.key
    console.log(discordServer)
    const serverConfiguration = await fetch("https://snallabot-event-sender-b869b2ccfed0.herokuapp.com/query", {
        method: "POST",
        body: JSON.stringify({ event_types: ["BROADCAST_CONFIGURATION"], key: discordServer, after: 0 }),
        headers: {
            "Content-Type": "application/json"
        }
    }).then(res => res.json() as Promise<BroadcastConfigurationEvents>)
    console.log(serverConfiguration)
    const sortedEvents = serverConfiguration.BROADCAST_CONFIGURATION.sort((a: BroadcastConfiguration, b: BroadcastConfiguration) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    if (sortedEvents.length === 0) {
        console.error(`${discordServer} is not configured for Broadcasts`)
    } else {
        const configuration = sortedEvents[0]
        const channel = configuration.channel_id
        const role = configuration.role ? `<@&${configuration.role}>` : ""
        await requestDiscord(`channels/${channel}/messages`, {
            method: "POST",
            body: {
                content: `${role} ${broadcastEvent.title}\n\n${broadcastEvent.video}`
            }
        })
    }
    ctx.status = 200
}).post("/slashCommand", async (ctx) => {
    await handleInteraction(ctx, prodBotVerifier)
}).post("/testSlashCommand", async (ctx) => {
    await handleInteraction(ctx, testBotVerifier)
})

app.use(bodyParser({ enableTypes: ["json"], encoding: "utf-8" }))
    .use(async (ctx, next) => {
        try {
            await next()
        } catch (err: any) {
            console.error(err)
            ctx.status = 500;
            ctx.body = {
                message: err.message
            };
        }
    })
    .use(router.routes())
    .use(router.allowedMethods())

export default app
