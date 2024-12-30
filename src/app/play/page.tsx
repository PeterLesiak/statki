'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { getTileLocation, pointInsideRect, snapRectToGrid } from '@/utils';

type BoardCell = 'empty' | 'hover' | 'full';

const shipImages: { path: string; width: number; height: number }[] = [
  { path: '/images/Ship 1 - Full.png', width: 30, height: 86 },
  { path: '/images/Ship 2 - Full.png', width: 30, height: 115 },
  { path: '/images/Ship 3 - Full.png', width: 30, height: 150 },
  { path: '/images/Ship 4 - Full.png', width: 30, height: 176 },
];

export default function Play() {
  const [boardWidth, setBoardWidth] = useState(14);
  const [boardHeight, setBoardHeight] = useState(14);
  const [board, setBoard] = useState<BoardCell[]>(
    Array<BoardCell>(boardWidth * boardHeight).fill('empty'),
  );

  const shipRef = useRef<(HTMLImageElement | null)[]>([]);
  const shipContainerRef = useRef<(HTMLDivElement | null)[]>([]);
  const shipBoardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ships = shipRef.current;
    const shipContainer = shipContainerRef.current;
    const shipBoard = shipBoardRef.current!;

    let dragging: { ship: HTMLImageElement; offsetX: number; offsetY: number } | false = false;
    let valid: boolean = false;

    const handleShipMove = (event: MouseEvent): void => {
      if (!dragging) return;

      const { ship, offsetX, offsetY } = dragging;

      ship.style.left = `${event.x - offsetX}px`;
      ship.style.top = `${event.y - offsetY}px`;

      const boardRect = shipBoard.getBoundingClientRect();
      const shipRect = ship.getBoundingClientRect();

      valid = pointInsideRect(
        event.x - offsetX,
        event.y - offsetY,
        boardRect.left,
        boardRect.top,
        boardRect.width,
        boardRect.height,
      );

      const newBoard = board.map<BoardCell>(cell => (cell == 'hover' ? 'empty' : cell));

      if (!valid) {
        setBoard(newBoard);

        return;
      }

      const left = event.x - boardRect.left - offsetX;
      const top = event.y - boardRect.top - offsetY;
      const tileSize = boardRect.width / boardWidth;

      const [leftSnapped, topSnapped] = snapRectToGrid(
        left,
        top,
        shipRect.width,
        shipRect.height,
        tileSize,
      );

      const shipTileHeight = Math.ceil(shipRect.height / tileSize);
      const [row, _] = getTileLocation(leftSnapped, topSnapped, tileSize);
      const invertY = row + shipTileHeight > boardHeight;

      for (let i = 0; i < shipTileHeight; ++i) {
        const x = leftSnapped;
        const y = topSnapped + (invertY ? -i : i) * tileSize;

        const [row, column] = getTileLocation(x, y, tileSize);
        const index = column + row * boardHeight;

        newBoard[index] = 'hover';
      }

      setBoard(newBoard);
    };

    const shipMousedownEvent = (event: MouseEvent): void => {
      event.preventDefault();

      const ship = event.target! as HTMLImageElement;
      const shipRect = ship.getBoundingClientRect();

      const offsetX = event.x - shipRect.left;
      const offsetY = event.y - shipRect.top;

      dragging = { ship, offsetX, offsetY };
      document.body.append(ship);

      handleShipMove(event);
    };

    const documentMousemoveEvent = (event: MouseEvent): void => {
      if (!dragging) return;

      handleShipMove(event);
    };

    const documentMouseupEvent = (event: MouseEvent): void => {
      if (!dragging) return;

      const { ship, offsetX, offsetY } = dragging;

      const boardRect = shipBoard.getBoundingClientRect();
      const shipRect = ship.getBoundingClientRect();

      if (valid) {
        const left = event.x - boardRect.left - offsetX;
        const top = event.y - boardRect.top - offsetY;
        const tileSize = boardRect.width / boardWidth;

        const [leftSnapped, topSnapped] = snapRectToGrid(
          left,
          top,
          shipRect.width,
          shipRect.height,
          tileSize,
        );

        const shipTileHeight = Math.ceil(shipRect.height / tileSize);
        const [row, _] = getTileLocation(leftSnapped, topSnapped, tileSize);
        const invertY = row + shipTileHeight > boardHeight;

        const topClampped = topSnapped - (invertY ? (shipTileHeight - 1) * tileSize : 0);

        ship.style.left = `${leftSnapped}px`;
        ship.style.top = `${topClampped}px`;
        shipBoard.append(ship);

        const boardWithoutHover = board.map(cell => (cell == 'hover' ? 'empty' : cell));
        setBoard(boardWithoutHover);
      } else {
        const index = Number(ship.id.substring(5));
        const container = shipContainer[index]!;

        ship.style.left = '';
        ship.style.top = '';
        container.append(ship);
      }

      dragging = false;
      valid = false;
    };

    for (const ship of ships) {
      ship!.addEventListener('mousedown', shipMousedownEvent);
    }

    document.addEventListener('mousemove', documentMousemoveEvent);
    document.addEventListener('mouseup', documentMouseupEvent);

    return (): void => {
      for (const ship of ships) {
        ship!.removeEventListener('mousedown', shipMousedownEvent);
      }

      document.removeEventListener('mousemove', documentMousemoveEvent);
      document.removeEventListener('mouseup', documentMouseupEvent);
    };
  }, [boardWidth, boardHeight]);

  return (
    <div className="grid h-full place-items-center">
      <main className="flex gap-16 rounded-lg bg-light-200 px-16 py-8 shadow-[8px_8px_0_0_theme(colors.dark.800)] drop-shadow-2xl">
        <section className="flex flex-col gap-4 rounded-lg drop-shadow-2xl">
          {shipImages.map((ship, index) => (
            <div
              ref={instance => void (shipContainerRef.current[index] = instance)}
              className="relative"
              style={{ width: ship.width, height: ship.height }}
              key={index}
            >
              <Image
                ref={instance => void (shipRef.current[index] = instance)}
                src={ship.path}
                width={ship.width}
                height={ship.height}
                alt="Ship"
                draggable="false"
                id={`ship-${index}`}
                className="absolute cursor-pointer"
              />
            </div>
          ))}
        </section>

        <div className="flex flex-col justify-center gap-2">
          <h2 className="mb-8 w-full text-center text-3xl">Rozmieść jednostki na planszy</h2>

          <div className="flex justify-center">
            <div
              id="tile-grid"
              className="relative grid aspect-square h-[30rem] rounded border-2 border-dark-800"
              style={{
                gridTemplateRows: `repeat(${boardWidth}, minmax(0, 1fr))`,
                gridTemplateColumns: `repeat(${boardHeight}, minmax(0, 1fr))`,
              }}
            >
              {board.map((cell, index) => (
                <div
                  className={`${cell == 'hover' ? 'bg-light-400' : ''} border border-dark-800`}
                  key={index}
                ></div>
              ))}

              <div ref={shipBoardRef} className="absolute h-full w-full"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
