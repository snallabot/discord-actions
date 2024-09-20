import { Team } from "./madden_types";

interface MaddenClient {
    getLatestTeams(leagueId: string): Promise<Array<Team>>
}

function eventSorter(a1: { timestamp: string }, b1: { timestamp: string }) {
    return new Date(b1.timestamp).getTime() - new Date(a1.timestamp).getTime()
}

export default {
    getLatestTeams: async function(leagueId: string) {
        const res = await fetch("https://snallabot-event-sender-b869b2ccfed0.herokuapp.com/query", {
            method: "POST",
            body: JSON.stringify({ event_types: ["MADDEN_TEAM"], key: leagueId, after: 0, limit: 10000 }),
            headers: {
                "Content-Type": "application/json"
            }
        })
        const teamsData = await res.json() as { "MADDEN_TEAM": Array<Team> }
        return Object.values(Object.groupBy(teamsData.MADDEN_TEAM, team => team.teamId)).flatMap(teamDocs => teamDocs ? [teamDocs.sort(eventSorter)[0]] : [])

    }
} as MaddenClient
