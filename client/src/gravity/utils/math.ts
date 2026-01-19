export const PHI = (1 + Math.sqrt(5)) / 2;

export const randomBetween = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export const randomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

export const clearCanvas = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

export const randomColor = (): string => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 60 + Math.floor(Math.random() * 40);
  const lightness = 45 + Math.floor(Math.random() * 20);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};
