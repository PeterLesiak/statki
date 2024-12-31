'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { getTileLocation, pointInsideRect, snapRectToGrid } from '@/utils';

type BoardCell = 'empty' | 'hover' | 'full';

const shipImages: { path: string; width: number; height: number }[] = [
  { path: '/images/Ship 1 - Full.png', width: 30, height: 86 },
  { path: '/images/Ship 2 - Full.png', width: 30, height: 115 },
  { path: '/images/Ship 2 - Full.png', width: 30, height: 115 },
  { path: '/images/Ship 3 - Full.png', width: 30, height: 150 },
  { path: '/images/Ship 3 - Full.png', width: 30, height: 150 },
  { path: '/images/Ship 4 - Full.png', width: 30, height: 176 },
];

export default function Play() {
  const boardWidth = 14;
  const boardHeight = 14;

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

      setBoard(board => {
        const newBoard = board.map<BoardCell>(cell => (cell == 'hover' ? 'empty' : cell));

        if (!valid) {
          return newBoard;
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

        const [startRow, startColumn] = getTileLocation(leftSnapped, topSnapped, tileSize);
        const shipTileHeight = Math.ceil(shipRect.height / tileSize);

        if (startRow + shipTileHeight > boardHeight) {
          valid = false;

          return newBoard;
        }

        for (let i = 0; i < shipTileHeight; ++i) {
          const row = startRow + i;
          const column = startColumn;
          const index = column + row * boardHeight;

          if (newBoard[index] == 'full') {
            valid = false;

            return newBoard;
          }

          newBoard[index] = 'hover';
        }

        return newBoard;
      });
    };

    const shipMousedownEvent = (event: MouseEvent): void => {
      const ship = event.target as HTMLImageElement;

      const shipRect = ship.getBoundingClientRect();
      const boardRect = shipBoard.getBoundingClientRect();

      const offsetX = event.x - shipRect.left;
      const offsetY = event.y - shipRect.top;

      if (ship.parentElement == shipBoard) {
        setBoard(board => {
          const newBoard = [...board];

          const left = parseInt(ship.style.left) - boardRect.left;
          const top = parseInt(ship.style.top) - boardRect.top;
          const tileSize = boardRect.width / boardWidth;

          const [row, column] = getTileLocation(left, top, tileSize);
          const shipTileHeight = Math.ceil(shipRect.height / tileSize);

          for (let i = 0; i < shipTileHeight; ++i) {
            const index = column + (row + i) * boardHeight;

            newBoard[index] = 'empty';
          }

          return newBoard;
        });
      }

      dragging = { ship, offsetX, offsetY };
      document.body.append(ship);

      handleShipMove(event);
    };

    const documentMousemoveEvent = (event: MouseEvent): void => {
      if (!dragging) return;

      handleShipMove(event);
    };

    const documentScrollEvent = (event: Event): void => {};

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

        setBoard(board => {
          const newBoard = board.map<BoardCell>(cell => (cell == 'hover' ? 'empty' : cell));

          const [startRow, startColumn] = getTileLocation(leftSnapped, topSnapped, tileSize);
          const shipTileHeight = Math.ceil(shipRect.height / tileSize);

          for (let i = 0; i < shipTileHeight; ++i) {
            const row = startRow + i;
            const column = startColumn;
            const index = column + row * boardHeight;

            newBoard[index] = 'full';
          }

          return newBoard;
        });

        ship.style.left = `${leftSnapped}px`;
        ship.style.top = `${topSnapped}px`;
        shipBoard.append(ship);
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

    const eventOptions: AddEventListenerOptions = {
      passive: true /* enable performance optimizations */,
    };

    for (const ship of ships) {
      ship!.addEventListener('mousedown', shipMousedownEvent, eventOptions);
    }

    document.addEventListener('mousemove', documentMousemoveEvent, eventOptions);
    document.addEventListener('scroll', documentScrollEvent, eventOptions);
    document.addEventListener('mouseup', documentMouseupEvent, eventOptions);

    return (): void => {
      for (const ship of ships) {
        ship?.removeEventListener('mousedown', shipMousedownEvent);
      }

      document.removeEventListener('mousemove', documentMousemoveEvent);
      document.removeEventListener('mouseup', documentMouseupEvent);
    };
  }, []);

  return (
    <div className="grid h-full place-items-center">
      <main className="flex gap-16 rounded-lg bg-light-200 px-16 py-8 shadow-[8px_8px_0_0_theme(colors.dark.800)] drop-shadow-2xl">
        <section
          className="grid items-center gap-4 rounded-lg"
          style={{ gridTemplateColumns: `repeat(${shipImages.length / 3}, minmax(0, 1fr))` }}
        >
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
                className="absolute cursor-pointer select-none"
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
                  className={`${cell == 'hover' ? 'bg-light-400' : ''} ${cell == 'full' ? 'bg-orange-500' : ''} border border-dark-800`}
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
