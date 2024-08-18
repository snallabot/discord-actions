import { ParameterizedContext } from "koa"
import { verifyKey } from "discord-interactions"
import { InteractionResponseType } from "discord-api-types/v10"

export interface DiscordClient {
    requestDiscord(endpoint: string, options: { [key: string]: any }, maxTries?: number): Promise<Response>,
    interactionVerifier(ctx: ParameterizedContext): Promise<boolean>
}

type DiscordSettings = { publicKey: string, botToken: string, appId: string }
export function createClient(settings: DiscordSettings): DiscordClient {
    return {
        requestDiscord: async (endpoint: string, options: { [key: string]: any }, maxTries: number = 10) => {
            // append endpoint to root API URL
            const url = "https://discord.com/api/v10/" + endpoint
            if (options.body) options.body = JSON.stringify(options.body)
            let tries = 0
            while (tries < maxTries) {
                const res = await fetch(url, {
                    headers: {
                        Authorization: `Bot ${settings.botToken}`,
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
            throw new Error("max tries reached")
        },
        interactionVerifier: async (ctx: ParameterizedContext) => {
            const signature = ctx.get("x-signature-ed25519")
            const timestamp = ctx.get("x-signature-timestamp")
            return await verifyKey(
                ctx.request.rawBody,
                signature,
                timestamp,
                settings.publicKey
            )

        }
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
