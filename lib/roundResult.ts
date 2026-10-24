export const ROUND_RESULT : Record<string, string> = {
    "Bomb defused": "/pliers.png",
    "Bomb detonated": "/bomb.png",
    "Eliminated": '/skull-fill.png',
    "Round timer expired": '/clock-x.png',
}

export function getRoundResult(result : any) : string {
    if(!result) return "Desconhecido";

    return ROUND_RESULT[result] || "Desconhecido";
}