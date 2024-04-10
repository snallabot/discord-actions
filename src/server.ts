import Koa from "koa"
import Router from "@koa/router"
import bodyParser from "@koa/bodyparser"

const app = new Koa()
const router = new Router()


type MaddenBroadcast = { key: string, event_type: "MADDEN_BROADCAST", delivery: "EVENT_SOURCE", title: string, video: string }
type BroadcastConfiguration = { channel_id: string, role?: string, id: string, timestamp: string }
type BroadcastConfigurationEvents = { "BROADCAST_CONFIGURATION": Array<BroadcastConfiguration> }

async function requestDiscord(
    endpoint: string,
    options: { [key: string]: any },
    token = process.env.DISCORD_TOKEN,
    maxTries = 5
) {
    // append endpoint to root API URL
    const url = "https://discord.com/api/v9/" + endpoint
    if (options.body) options.body = JSON.stringify(options.body)
    let tries = 0
    while (tries < maxTries) {
        const res = await fetch(url, {
            headers: {
                Authorization: `Bot ${token}`,
                "Content-Type": "application/json; charset=UTF-8",
            },
            ...options,
        })
        if (!res.ok) {
            const data = await res.json()
            if (data["retry_after"]) {
                tries = tries + 1
                await new Promise((r) => setTimeout(r, data["retry_after"] * 1000))
            } else {
                console.log(res)
                throw new Error(JSON.stringify(data))
            }
        } else {
            return res
        }
    }
}

router.post("/sendBroadcast", async (ctx) => {
    const broadcastEvent = ctx.request.body as MaddenBroadcast
    const discordServer = broadcastEvent.key
    console.log(discordServer)
    const serverConfiguration = await fetch("https://snallabot-event-sender-b869b2ccfed0.herokuapp.com/query", {
        method: "POST",
        body: JSON.stringify({ event_types: ["BROADCAST_CONFIGURATION"], key: discordServer }),
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
