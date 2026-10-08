import { createCanvas, loadImage } from "@napi-rs/canvas";
import { readFile, writeFile } from "node:fs/promises";
const svg = await readFile("public/icons/icon.svg");
const image = await loadImage(svg);
for (const size of [192, 512]) {
  const canvas = createCanvas(size, size);
  canvas.getContext("2d").drawImage(image, 0, 0, size, size);
  await writeFile(
    `public/icons/icon-${size}.png`,
    canvas.toBuffer("image/png"),
  );
}
