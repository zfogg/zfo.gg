import { useEffect, useRef } from 'react';
import { Vector2Pool, normalize, hypotenuse, direction, type Vector2 } from '../gravity/utils/Vector2';
import { PHI, randomBetween, randomElement, clearCanvas, randomColor } from '../gravity/utils/math';
import { PhysicalSquare } from '../gravity/bodies/PhysicalSquare';
import { PhysicalCursor } from '../gravity/bodies/PhysicalCursor';
import { AABB } from '../gravity/barnes-hut/AABB';
import { SquareTree } from '../gravity/barnes-hut/SquareTree';

export interface GravityConfig {
  gravity: number;
  friction: number;
  distance: number;
  cursorFriction: number;
  cursorMass: number;
  cursorForce: number;
  particlesN: number;
}

const defaultConfig: GravityConfig = {
  gravity: randomBetween(4, 9) * Math.pow(10, -1),
  friction: randomBetween(2, 6) * Math.pow(10, -4),
  distance: randomBetween(5, 9),
  cursorFriction: randomBetween(1, 4),
  cursorMass: 1750,
  cursorForce: 0.15,
  particlesN: 13,
};

export const useGravity = (externalConfig?: GravityConfig) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const resetSquaresCallbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas
    const container = canvas.parentElement;
    if (container) {
      canvas.width = Math.min(1920, container.clientWidth);
      canvas.height = canvas.width;
    }

    // Initialize
    const vectors = new Vector2Pool(1000);
    const config = { ...(externalConfig || defaultConfig) };
    let gameTime = 0;
    let squares: PhysicalSquare[] = [];
    let cursor: PhysicalCursor;
    let qt: SquareTree;

    // Initialize cursor
    cursor = new PhysicalCursor(
      canvas,
      vectors,
      vectors.get(0, 0),
      vectors.get(0, 0)
    );

    // Set up cursor callbacks
    const originalFriction = config.friction;
    const originalGravity = config.gravity;

    cursor.onMouseDown = (isLeft: boolean, isRight: boolean) => {
      if (isLeft) {
        cursor.mass = config.cursorMass;
        config.friction = originalFriction * config.cursorFriction;
      } else if (isRight) {
        cursor.mass = 0.25 * config.cursorMass;
        config.friction = 0.2 * originalFriction * config.cursorFriction;
      }
    };

    cursor.onMouseUp = () => {
      cursor.mass = 0;
      config.friction = originalFriction;
      config.gravity = originalGravity;
    };

    cursor.onMouseUpCanvas = (isLeft: boolean) => {
      if (isLeft) {
        console.log('onMouseUpCanvas called, deadzone:', config.distance);
        let blockCount = 0;
        let applyCount = 0;
        for (const s of squares) {
          const dist = Math.sqrt(
            Math.pow(s.position[0] - cursor.position[0], 2) +
            Math.pow(s.position[1] - cursor.position[1], 2)
          );
          if (dist < 25) {
            if (dist > config.distance) {
              const d = direction(s.position, cursor.position, vectors);
              normalize(d);
              const f = vectors.get(-d[0] * config.cursorForce, -d[1] * config.cursorForce);
              s.applyForce(f);
              vectors.put(f);
              vectors.put(d);
              applyCount++;
            } else {
              console.log('Cursor deadzone blocked force:', { dist, deadzone: config.distance });
              blockCount++;
            }
          }
        }
        console.log('Mouse release summary:', { applied: applyCount, blocked: blockCount });
      }
    };

    // Gravity calculation
    const attractionOfGravity = (
      b1: PhysicalSquare | { position: Vector2; mass: number },
      b2: PhysicalSquare | { position: Vector2; mass: number }
    ): Vector2 => {
      const d = direction(b1.position, b2.position, vectors);
      const r = hypotenuse(d[0], d[1]);
      const v = vectors.get();

      if (r !== 0 && r > config.distance) {
        const g = (config.gravity * b1.mass * b2.mass) / Math.pow(r, 2);
        normalize(d, r);
        v[0] = -d[0] * g;
        v[1] = -d[1] * g;
      }

      vectors.put(d);
      return v;
    };

    const applyGravity = (body1: PhysicalSquare, body2: PhysicalSquare): void => {
      const f = attractionOfGravity(body1, body2);
      body1.applyForce(f);
      f[0] = -f[0];
      f[1] = -f[1];
      body2.applyForce(f);
      vectors.put(f);
    };

    // Construction helpers
    const constructSquares = (rows: number, columns: number, size: number | (() => number)): PhysicalSquare[] => {
      const xmargin = canvas.width / columns;
      const ymargin = canvas.height / rows;
      const newSquares: PhysicalSquare[] = [];

      for (let n = 0; n < rows * columns; n++) {
        const x = Math.floor(n / columns) * xmargin + xmargin / 2;
        const y = (n % rows) * ymargin + ymargin / 2;
        const position = vectors.get(x, y);
        const squareSize = typeof size === 'function' ? size() : size;
        const square = new PhysicalSquare(
          position,
          squareSize * PHI / 2,
          squareSize,
          n,
          randomColor(),
          canvas.width,
          canvas.height,
          vectors.get(0, 0)
        );
        newSquares.push(square);
      }

      return newSquares;
    };

    const resetSquares = (gridSize: number): PhysicalSquare[] => {
      // Clean up old squares
      for (const s of squares) {
        s.destructor(vectors);
      }

      const useVariableSize = Math.random() > 0.5;
      const size = useVariableSize
        ? () => randomElement(Array.from({ length: 21 }, (_, i) => 4.25 + i * 0.125))
        : randomElement([4, 5, 6, 7]);

      return constructSquares(gridSize, gridSize, size);
    };

    const newSquareTree = (ss: PhysicalSquare[], recurLimit: number = 5): SquareTree => {
      const s = canvas.width / 2;
      return new SquareTree(new AABB([s, s], s), ss, recurLimit);
    };

    // Initialize squares and quadtree
    squares = resetSquares(config.particlesN);
    qt = newSquareTree(squares, 5);

    // Expose reset callback
    resetSquaresCallbackRef.current = () => {
      squares = resetSquares(config.particlesN);
      qt = newSquareTree(squares, 5);
    };

    // Keyboard handler for spacebar
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        for (const s of squares) {
          const randomForce = () => randomElement([-1, 1]) * randomBetween(0.1 * s.mass, 0.4 * s.mass);
          s.applyForce(vectors.get(randomForce(), randomForce()));
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    // Main animation loop
    const main = () => {
      // Update
      cursor.update(gameTime);

      // Update squares
      const cursorPressed = cursor.isClicked.left || cursor.isClicked.right;
      for (const square of squares) {
        square.update(
          config.friction,
          cursorPressed,
          cursorPressed ? () => applyGravity(square, cursor as any) : undefined
        );
      }

      // Update quadtree
      qt.clear();
      for (const s of squares) {
        qt.insert(s);
      }
      for (const s of squares) {
        qt.applyForceTo(s, vectors, attractionOfGravity);
      }

      // Render
      clearCanvas(canvas, ctx);
      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      qt.map((t: SquareTree) => t.draw(ctx));
      ctx.closePath();
      ctx.stroke();

      cursor.draw(ctx);
      for (const s of squares) {
        s.draw(ctx);
      }

      gameTime++;
      animationIdRef.current = window.requestAnimationFrame(main);
    };

    // Start animation
    main();

    // Cleanup
    return () => {
      if (animationIdRef.current !== null) {
        window.cancelAnimationFrame(animationIdRef.current);
      }
      document.removeEventListener('keydown', handleKeyPress);
      cursor.cleanup();
      for (const s of squares) {
        s.destructor(vectors);
      }
      vectors.clear();
    };
  }, [externalConfig]);

  return { canvasRef, resetSquares: () => resetSquaresCallbackRef.current?.() };
};
