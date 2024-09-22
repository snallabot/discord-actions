type DefaultEventInfo = {
    platform: string,
    key: string,
    id: string,
    timestamp: string
}

export type Team = {
    ovrRating: number,
    injuryCount: number,
    divName: string,
    cityName: string,
    teamId: number,
    logoId: number,
    abbrName: string,
    userName: string,
    nickName: string,
    offScheme: number,
    secondaryColor: number,
    primaryColor: number,
    defScheme: number,
    displayName: string,
    event_type: "MADDEN_TEAM"
} & DefaultEventInfo

export type MaddenGame = {
    status: number,
    awayScore: number,
    awayTeamId: number,
    weekIndex: number,
    homeScore: number,
    homeTeamId: number,
    scheduleId: number,
    seasonIndex: number,
    isGameOfTheWeek: boolean,
    stageIndex: number,
    event_type: "MADDEN_SCHEDULE",
} & DefaultEventInfo

export const MADDEN_SEASON = 2024
