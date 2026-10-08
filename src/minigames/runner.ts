export type RunItem = {
  id: string;
  lane: number;
  distance: number;
  kind: "coin" | "bill";
  taken: boolean;
};
export const laneX = (lane: number) => lane * 2.6;
export function runnerItems(): RunItem[] {
  const list: RunItem[] = [];
  for (let i = 0; i < 32; i++) {
    const distance = 7 + i * 4.6;
    list.push({
      id: "coin-" + i,
      lane: (i % 3) - 1,
      distance,
      kind: "coin",
      taken: false,
    });
    if (i % 3 === 2)
      list.push({
        id: "bill-" + i,
        lane: ((i + 1) % 3) - 1,
        distance: distance + 2,
        kind: "bill",
        taken: false,
      });
  }
  return list;
}
export function touching(
  item: RunItem,
  distance: number,
  x: number,
  jump: number,
) {
  return (
    !item.taken &&
    Math.abs(item.distance - distance) < 1.15 &&
    Math.abs(laneX(item.lane) - x) < 1 &&
    (item.kind === "coin" ? jump < 1.8 : jump < 0.65)
  );
}
