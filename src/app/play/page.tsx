'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { PlayIcon, ShuffleIcon, Trash2Icon } from 'lucide-react';

import { getTileLocation, pointInsideRect, snapRectToGrid } from '@/utils';

type BoardCell = 'empty' | 'hover' | 'full';

const shipImages: { path: string; width: number; height: number }[] = [
  { path: '/images/Ship 1 - Full.png', width: 30, height: 81 },
  { path: '/images/Ship 2 - Full.png', width: 30, height: 115 },
  { path: '/images/Ship 2 - Full.png', width: 30, height: 115 },
  { path: '/images/Ship 3 - Full.png', width: 30, height: 150 },
  { path: '/images/Ship 3 - Full.png', width: 30, height: 150 },
  { path: '/images/Ship 4 - Full.png', width: 30, height: 176 },
];

export default function Play() {
  const boardWidth = 14;
  const boardHeight = 14;

  const [board, setBoard] = useState<BoardCell[]>(() => {
    const board = Array<BoardCell>(boardWidth * boardHeight);

    return board.fill('empty');
  });

  const shipRef = useRef<(HTMLImageElement | null)[]>([]);
  const shipContainerRef = useRef<(HTMLDivElement | null)[]>([]);
  const shipBoardRef = useRef<HTMLDivElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const randomButtonRef = useRef<HTMLButtonElement>(null);
  const removeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const ships = shipRef.current;
    const shipContainer = shipContainerRef.current;
    const shipBoard = shipBoardRef.current!;
    const playButton = playButtonRef.current!;
    const randomButton = randomButtonRef.current!;
    const removeButton = removeButtonRef.current!;

    const shipsPlaced = new Set<HTMLImageElement>();

    let dragging: { ship: HTMLImageElement; offsetX: number; offsetY: number } | false = false;
    let valid: boolean = false;

    const playButtonClickEvent = (): void => {
      alert('play');
    };

    const randomButtonClickEvent = (): void => {
      const newBoard = board.map<BoardCell>(() => 'empty');

      const canPlaceShip = (
        startRow: number,
        startColumn: number,
        length: number,
      ): boolean => {
        for (let i = 0; i < length; ++i) {
          const row = startRow + i;
          const column = startColumn;
          const index = column + row * boardHeight;

          if (row >= boardHeight || column >= boardWidth || newBoard[index] == 'full') {
            return false;
          }

          for (let borderRow = -1; borderRow <= 1; ++borderRow) {
            for (let borderColumn = -1; borderColumn <= 1; ++borderColumn) {
              const nextRow = row + borderRow;
              const nextColumn = column + borderColumn;
              const index = nextColumn + nextRow * boardHeight;

              if (
                nextRow >= 0 &&
                nextRow < boardHeight &&
                nextColumn >= 0 &&
                nextColumn < boardWidth &&
                newBoard[index] == 'full'
              ) {
                return false;
              }
            }
          }
        }

        return true;
      };

      const placeShip = (
        ship: HTMLImageElement,
        startRow: number,
        startColumn: number,
        length: number,
      ): void => {
        const boardRect = shipBoard.getBoundingClientRect();
        const shipRect = ship.getBoundingClientRect();

        const tileSize = boardRect.width / boardWidth;
        const left = startColumn * tileSize;
        const top = startRow * tileSize;

        const [leftSnapped, topSnapped] = snapRectToGrid(
          left,
          top,
          shipRect.width,
          shipRect.height,
          tileSize,
        );

        ship.style.left = `${leftSnapped}px`;
        ship.style.top = `${topSnapped}px`;
        shipBoard.append(ship);
        shipsPlaced.add(ship);

        for (let i = 0; i < length; ++i) {
          const row = startRow + i;
          const column = startColumn;
          const index = column + row * boardHeight;

          newBoard[index] = 'full';
        }
      };

      for (const ship of ships) {
        const boardRect = shipBoard.getBoundingClientRect();
        const tileSize = boardRect.width / boardWidth;

        const shipRect = ship!.getBoundingClientRect();
        const length = Math.ceil(shipRect.height / tileSize);

        while (true) {
          const startRow = Math.floor(Math.random() * boardHeight);
          const startColumn = Math.floor(Math.random() * boardWidth);

          if (canPlaceShip(startRow, startColumn, length)) {
            placeShip(ship!, startRow, startColumn, length);

            break;
          }
        }
      }

      setBoard(newBoard);

      playButton.classList.remove('opacity-25', 'pointer-events-none');
    };

    const removeButtonClickEvent = (): void => {
      setBoard(board => board.map<BoardCell>(() => 'empty'));

      for (let i = 0; i < ships.length; ++i) {
        const ship = ships[i]!;
        const container = shipContainer[i]!;

        ship.style.left = '';
        ship.style.top = '';
        container.append(ship);
      }

      shipsPlaced.clear();
      playButton.classList.add('opacity-25', 'pointer-events-none');
    };

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

          for (let borderRow = -1; borderRow <= 1; ++borderRow) {
            for (let borderColumn = -1; borderColumn <= 1; ++borderColumn) {
              const nextRow = row + borderRow;
              const nextColumn = column + borderColumn;
              const index = nextColumn + nextRow * boardHeight;

              if (
                nextRow >= 0 &&
                nextRow < boardHeight &&
                nextColumn >= 0 &&
                nextColumn < boardWidth &&
                newBoard[index] == 'full'
              ) {
                valid = false;

                return newBoard;
              }
            }
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
        shipsPlaced.delete(ship);
        playButton.classList.add('opacity-25', 'pointer-events-none');

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
          const newBoard = [...board];

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

        shipsPlaced.add(ship);
        if (shipsPlaced.size == ships.length) {
          playButton.classList.remove('opacity-25', 'pointer-events-none');
        }
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

    playButton.addEventListener('click', playButtonClickEvent, eventOptions);
    randomButton.addEventListener('click', randomButtonClickEvent, eventOptions);
    removeButton.addEventListener('click', removeButtonClickEvent, eventOptions);

    for (const ship of ships) {
      ship!.addEventListener('mousedown', shipMousedownEvent, eventOptions);
    }

    document.addEventListener('mousemove', documentMousemoveEvent, eventOptions);
    document.addEventListener('mouseup', documentMouseupEvent, eventOptions);

    return (): void => {
      playButton.removeEventListener('click', playButtonClickEvent, eventOptions);
      randomButton.removeEventListener('click', randomButtonClickEvent, eventOptions);
      removeButton.removeEventListener('click', removeButtonClickEvent, eventOptions);

      for (const ship of ships) {
        ship?.removeEventListener('mousedown', shipMousedownEvent);
      }

      document.removeEventListener('mousemove', documentMousemoveEvent);
      document.removeEventListener('mouseup', documentMouseupEvent);
    };
  }, []);

  return (
    <div className="grid h-full place-items-center">
      <main className="grid grid-cols-[1fr_5fr_1fr] gap-16 rounded-lg bg-light-200 px-16 py-8 shadow-[8px_8px_0_0_theme(colors.dark.800)] drop-shadow-2xl">
        <section
          className="grid place-items-center gap-4"
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
                style={{ width: ship.width, height: ship.height }}
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

        <section className="flex flex-col justify-around gap-4 px-1">
          <button
            ref={playButtonRef}
            title="Start game"
            className="pointer-events-none grid aspect-square place-items-center rounded border-4 border-dark-800 p-3 opacity-25 transition ease-out *:stroke-dark-800 hover:scale-105 hover:border-blue-500 *:hover:stroke-blue-500"
          >
            <PlayIcon strokeWidth={2.8} className="h-full w-full" />
          </button>
          <button
            ref={randomButtonRef}
            title="Place ships in random order"
            className="grid aspect-square place-items-center rounded border-4 border-dark-800 p-3 transition ease-out *:stroke-dark-800 hover:scale-105 hover:border-green-600 *:hover:stroke-green-600"
          >
            <ShuffleIcon strokeWidth={2.8} className="h-full w-full" />
          </button>
          <button
            ref={removeButtonRef}
            title="Remove all ships from the board"
            className="grid aspect-square place-items-center rounded border-4 border-dark-800 p-3 transition ease-out *:stroke-dark-800 hover:scale-105 hover:border-red-500 *:hover:stroke-red-500"
          >
            <Trash2Icon strokeWidth={2.8} className="h-full w-full" />
          </button>
        </section>
      </main>
    </div>
  );
}
