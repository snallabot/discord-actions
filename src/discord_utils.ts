import { ParameterizedContext } from "koa"
import { verifyKey } from "discord-interactions"
import { InteractionResponseType } from "discord-api-types/v10"


export async function requestDiscord(
    endpoint: string,
    options: { [key: string]: any },
    token = process.env.DISCORD_TOKEN,
    maxTries = 5
) {
    // append endpoint to root API URL
    const url = "https://discord.com/api/v10/" + endpoint
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

export function discordInteractionVerifier(clientKey: string) {
    return async function(ctx: ParameterizedContext) {
        const signature = ctx.get("x-signature-ed25519")
        const timestamp = ctx.get("x-signature-timestamp")
        return await verifyKey(
            ctx.request.rawBody,
            signature,
            timestamp,
            clientKey
        )
    }
}

export function respond(ctx: ParameterizedContext, body: any) {
    ctx.status = 200
    ctx.set("Content-Type", "application/json")
    ctx.body = body
}

export function createMessageResponse(content: string) {
    return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            content: content
        }
    }
}
