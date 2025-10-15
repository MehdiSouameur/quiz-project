export function generateGameId(): string {
  return "game-" + Math.floor(100 + Math.random() * 900).toString();
}
