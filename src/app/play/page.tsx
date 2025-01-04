'use client';

import Image from 'next/image';
import {
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { PlayIcon, ShuffleIcon, Trash2Icon } from 'lucide-react';

import { randomInteger, wait } from '@/utils';

const shipImageInfo: { path: string; width: number; height: number }[] = [
  { path: '/images/Ship 1 - Full.webp', width: 30, height: 81 },
  { path: '/images/Ship 2 - Full.webp', width: 30, height: 115 },
  { path: '/images/Ship 3 - Full.webp', width: 30, height: 150 },
  { path: '/images/Ship 4 - Full.webp', width: 30, height: 176 },
];

const getTileLocation = (x: number, y: number, tileSize: number): [number, number] => {
  const row = Math.floor(y / tileSize);
  const column = Math.floor(x / tileSize);

  return [row, column];
};

const pointInsideRect = (
  px: number,
  py: number,
  left: number,
  top: number,
  width: number,
  height: number,
): boolean => {
  return px > left && px < left + width && py > top && py < top + height;
};

const centerPointToTile = (
  left: number,
  top: number,
  width: number,
  height: number,
  tileSize: number,
  horizontal: boolean,
): [number, number] => {
  if (horizontal) {
    const leftRotated = left - 5;
    const topRotated = top + tileSize * 0.5;

    return [leftRotated, topRotated];
  }

  const leftCentered = left + (tileSize - (width % tileSize)) * 0.5;
  const topCentered = top + (tileSize - (height % tileSize)) * 0.5;

  return [leftCentered, topCentered];
};

type ShipData = { row: number; column: number; length: number; horizontal: boolean };

type ShipBoardCell = 'empty' | 'hover' | 'full' | 'border';

const generateShipBoard = (boardRows: number, boardColumns: number): ShipBoardCell[] => {
  const board = Array<ShipBoardCell>(boardRows * boardColumns);

  return board.fill('empty');
};

const getIndex = (row: number, column: number, boardColumns: number): number => {
  return column + row * boardColumns;
};

const isShipTile = (
  shipBoard: ShipBoardCell[],
  boardColumns: number,
  row: number,
  column: number,
): boolean => {
  const index = getIndex(row, column, boardColumns);

  return shipBoard[index] == 'full';
};

const canPlaceShip = (
  shipBoard: ShipBoardCell[],
  boardRows: number,
  boardColumns: number,
  ship: ShipData,
): boolean => {
  if (ship.horizontal && ship.column + ship.length > boardColumns) {
    return false;
  }

  if (!ship.horizontal && ship.row + ship.length > boardRows) {
    return false;
  }

  const minRow = Math.max(ship.row, 0);
  const maxRow = Math.min(ship.row + (ship.horizontal ? 0 : ship.length - 1), boardRows - 1);
  const minColumn = Math.max(ship.column, 0);
  const maxColumn = Math.min(
    ship.column + (ship.horizontal ? ship.length - 1 : 0),
    boardColumns - 1,
  );

  for (let row = minRow; row <= maxRow; ++row) {
    for (let column = minColumn; column <= maxColumn; ++column) {
      const index = getIndex(row, column, boardColumns);

      if (shipBoard[index] == 'full' || shipBoard[index] == 'border') {
        return false;
      }
    }
  }

  return true;
};

const placeShip = (
  shipBoard: ShipBoardCell[],
  boardRows: number,
  boardColumns: number,
  ship: ShipData,
): void => {
  const minRowUnclamped = ship.row - 1;
  const clampMinRow = minRowUnclamped < 0;
  const minRow = clampMinRow ? 0 : minRowUnclamped;

  const maxRowUnclamped = ship.row + (ship.horizontal ? 1 : ship.length);
  const clampMaxRow = maxRowUnclamped > boardRows - 1;
  const maxRow = clampMaxRow ? boardRows - 1 : maxRowUnclamped;

  const minColumnUnclamped = ship.column - 1;
  const clampMinColumn = minColumnUnclamped < 0;
  const minColumn = clampMinColumn ? 0 : minColumnUnclamped;

  const maxColumnUnclamped = ship.column + (ship.horizontal ? ship.length : 1);
  const clampMaxColumn = maxColumnUnclamped > boardColumns - 1;
  const maxColumn = clampMaxColumn ? boardColumns - 1 : maxColumnUnclamped;

  for (let row = minRow; row <= maxRow; ++row) {
    for (let column = minColumn; column <= maxColumn; ++column) {
      const index = getIndex(row, column, boardColumns);

      if (
        (row > minRow || (clampMinRow && row == 0)) &&
        (row < maxRow || (clampMaxRow && row == boardRows - 1)) &&
        (column > minColumn || (clampMinColumn && column == 0)) &&
        (column < maxColumn || (clampMaxColumn && column == boardColumns - 1))
      ) {
        shipBoard[index] = 'full';
        continue;
      }

      shipBoard[index] = 'border';
    }
  }
};

const isShipAround = (
  shipBoard: ShipBoardCell[],
  boardRows: number,
  boardColumns: number,
  row: number,
  column: number,
): boolean => {
  if (row > 0 && isShipTile(shipBoard, boardColumns, row - 1, column)) {
    return true;
  }

  if (row < boardRows - 1 && isShipTile(shipBoard, boardColumns, row + 1, column)) {
    return true;
  }

  if (column > 0 && isShipTile(shipBoard, boardColumns, row, column - 1)) {
    return true;
  }

  if (column < boardColumns - 1 && isShipTile(shipBoard, boardColumns, row, column + 1)) {
    return true;
  }

  if (row > 0 && column > 0 && isShipTile(shipBoard, boardColumns, row - 1, column - 1)) {
    return true;
  }

  if (
    row > 0 &&
    column < boardColumns - 1 &&
    isShipTile(shipBoard, boardColumns, row - 1, column + 1)
  ) {
    return true;
  }

  if (
    row < boardRows - 1 &&
    column < boardColumns - 1 &&
    isShipTile(shipBoard, boardColumns, row + 1, column + 1)
  ) {
    return true;
  }

  if (
    row < boardRows - 1 &&
    column > 0 &&
    isShipTile(shipBoard, boardColumns, row + 1, column - 1)
  ) {
    return true;
  }

  return false;
};

const removeShip = (
  shipBoard: ShipBoardCell[],
  boardRows: number,
  boardColumns: number,
  ship: ShipData,
): void => {
  const minRowUnclamped = ship.row - 1;
  const clampMinRow = minRowUnclamped < 0;
  const minRow = clampMinRow ? 0 : minRowUnclamped;

  const maxRowUnclamped = ship.row + (ship.horizontal ? 1 : ship.length);
  const clampMaxRow = maxRowUnclamped > boardRows - 1;
  const maxRow = clampMaxRow ? boardRows - 1 : maxRowUnclamped;

  const minColumnUnclamped = ship.column - 1;
  const clampMinColumn = minColumnUnclamped < 0;
  const minColumn = clampMinColumn ? 0 : minColumnUnclamped;

  const maxColumnUnclamped = ship.column + (ship.horizontal ? ship.length : 1);
  const clampMaxColumn = maxColumnUnclamped > boardColumns - 1;
  const maxColumn = clampMaxColumn ? boardColumns - 1 : maxColumnUnclamped;

  for (let row = minRow; row <= maxRow; ++row) {
    for (let column = minColumn; column <= maxColumn; ++column) {
      const index = column + row * boardColumns;

      if (
        (row > minRow || (clampMinRow && row == 0)) &&
        (row < maxRow || (clampMaxRow && row == boardRows - 1)) &&
        (column > minColumn || (clampMinColumn && column == 0)) &&
        (column < maxColumn || (clampMaxColumn && column == boardColumns - 1))
      ) {
        shipBoard[index] = 'empty';
      }

      continue;
    }
  }

  for (let row = minRow; row <= maxRow; ++row) {
    for (let column = minColumn; column <= maxColumn; ++column) {
      const index = column + row * boardColumns;

      if (
        (row > minRow || (clampMinRow && row == 0)) &&
        (row < maxRow || (clampMaxRow && row == boardRows - 1)) &&
        (column > minColumn || (clampMinColumn && column == 0)) &&
        (column < maxColumn || (clampMaxColumn && column == boardColumns - 1))
      ) {
        continue;
      }

      if (!isShipAround(shipBoard, boardRows, boardColumns, row, column)) {
        shipBoard[index] = 'empty';
      }
    }
  }
};

const generateRandomShipData = (
  boardRows: number,
  boardColumns: number,
  shipLengths: number[],
): [ShipData[], ShipBoardCell[]] => {
  const shipBoard = generateShipBoard(boardRows, boardColumns);
  const shipData: ShipData[] = [];

  for (const length of shipLengths) {
    const maxIterations = boardRows * boardColumns * 0.5;

    let shipPlaced: boolean = false;

    for (let iteration = 0; iteration < maxIterations; ++iteration) {
      const row = randomInteger(0, boardRows);
      const column = randomInteger(0, boardColumns);
      const horizontal = Math.random() > 0.5;
      const ship: ShipData = { row, column, length, horizontal };

      if (canPlaceShip(shipBoard, boardRows, boardColumns, ship)) {
        placeShip(shipBoard, boardRows, boardColumns, ship);
        shipData.push(ship);

        shipPlaced = true;
        break;
      }
    }

    if (!shipPlaced) {
      return generateRandomShipData(boardRows, boardColumns, shipLengths);
    }
  }

  return [shipData, shipBoard];
};

type BoardCell = 'hidden' | 'empty' | 'ship-part';

const generateBoard = (boardRows: number, boardColumns: number): BoardCell[] => {
  const board = Array<BoardCell>(boardRows * boardColumns);

  return board.fill('hidden');
};

const canHitShip = (row: number, column: number, ships: ShipData[]): 'empty' | 'ship-part' => {
  for (const ship of ships) {
    for (let i = 0; i < ship.length; ++i) {
      const shipRow = ship.row + (ship.horizontal ? 0 : i);
      const shipColumn = ship.column + (ship.horizontal ? i : 0);

      if (row == shipRow && column == shipColumn) {
        return 'ship-part';
      }
    }
  }

  return 'empty';
};

const enemyAI = (
  board: BoardCell[],
  boardRows: number,
  boardColumns: number,
  shipLengths: number[],
): [number, number] => {
  const row = randomInteger(0, boardRows);
  const column = randomInteger(0, boardColumns);

  return [row, column];
};

type GameState = 'ship-select' | 'player-select' | 'enemy-select';

interface BoardButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  color: 'red' | 'green' | 'blue';
  icon: ReactNode;
  disableOnSetup?: boolean;
}

function BoardButton({ ref, color, icon, disableOnSetup, ...props }: BoardButtonProps) {
  const colorToClassName = {
    red: 'hover:border-red-500 *:hover:stroke-red-500',
    green: 'hover:border-green-600 *:hover:stroke-green-600',
    blue: 'hover:border-blue-500 *:hover:stroke-blue-500',
  };

  return (
    <button
      ref={ref}
      className={`${colorToClassName[color]} ${disableOnSetup ? 'pointer-events-none opacity-25' : ''} grid aspect-square place-items-center rounded border-4 border-dark-800 p-3 transition ease-out *:h-full *:w-full *:stroke-dark-800 *:transition hover:scale-105`}
      {...props}
    >
      {icon}
    </button>
  );
}

export default function Play() {
  const boardRows = 14;
  const boardColumns = 14;
  const shipInfo: number[] = [0, 1, 1, 2, 2, 3];

  const [gameState, setGameState] = useState<GameState>('ship-select');
  const [playerShipData, setPlayerShipData] = useState<ShipData[]>([]);
  const [playerBoard, setPlayerBoard] = useState<BoardCell[]>(() =>
    generateBoard(boardRows, boardColumns),
  );
  const [enemyShipData, setEnemyShipData] = useState<ShipData[]>([]);
  const [enemyBoard, setEnemyBoard] = useState<BoardCell[]>(() =>
    generateBoard(boardRows, boardColumns),
  );
  const [shipBoard, setShipBoard] = useState(() => generateShipBoard(boardRows, boardColumns));

  const shipsRef = useRef<(HTMLImageElement | null)[]>([]);
  const shipPlaceholdersRef = useRef<(HTMLDivElement | null)[]>([]);
  const shipContainerRef = useRef<HTMLDivElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const shuffleButtonRef = useRef<HTMLButtonElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  const computeTileSize = (): number => {
    const shipContainer = shipContainerRef.current!;
    const shipContainerRect = shipContainer.getBoundingClientRect();

    return shipContainerRect.width / boardColumns;
  };

  const getShipLenghts = (tileSize: number): number[] => {
    return shipInfo.map(infoIndex => {
      const imageInfo = shipImageInfo[infoIndex];

      return Math.ceil(imageInfo.height / tileSize);
    });
  };

  useEffect(() => {
    const ships = [...shipsRef.current] as HTMLImageElement[];
    const shipPlaceholders = [...shipPlaceholdersRef.current] as HTMLDivElement[];
    const shipContainer = shipContainerRef.current!;
    const playButton = playButtonRef.current!;

    let dragging: { ship: HTMLImageElement; offsetX: number; offsetY: number } | false = false;
    let valid: boolean = false;

    const documentMousemouseEvent = (event: globalThis.MouseEvent): void => {
      if (!dragging) return;

      const { ship, offsetX, offsetY } = dragging;

      ship.style.left = `${event.x - offsetX}px`;
      ship.style.top = `${event.y - offsetY}px`;

      const boardRect = shipContainer.getBoundingClientRect();

      valid = pointInsideRect(
        event.x - offsetX,
        event.y - offsetY,
        boardRect.left,
        boardRect.top,
        boardRect.width,
        boardRect.height,
      );

      setShipBoard(previous => {
        const shipBoard = previous.map<ShipBoardCell>(cell =>
          cell == 'hover' ? 'empty' : cell,
        );

        if (!valid) {
          return shipBoard;
        }

        const tileSize = computeTileSize();
        const x = event.x - boardRect.left - offsetX;
        const y = event.y - boardRect.top - offsetY;

        const [row, column] = getTileLocation(x, y, tileSize);

        const lengths = getShipLenghts(tileSize);
        const index = Number(ship.dataset['index']);
        const length = lengths[index];

        const shipData: ShipData = { row, column, length, horizontal: false };

        valid = canPlaceShip(shipBoard, boardRows, boardColumns, shipData);

        if (!valid) {
          return shipBoard;
        }

        for (let i = 0; i < length; ++i) {
          const index = column + (row + i) * boardColumns;

          shipBoard[index] = 'hover';
        }

        return shipBoard;
      });
    };

    const shipMousedownEvent = (event: globalThis.MouseEvent): void => {
      const ship = event.target as HTMLImageElement;

      const shipRect = ship.getBoundingClientRect();
      const boardRect = shipContainer.getBoundingClientRect();

      const offsetX = event.x - shipRect.left;
      const offsetY = event.y - shipRect.top;

      if (ship.parentElement == shipContainer) {
        const tileSize = computeTileSize();
        const x = event.x - boardRect.left - offsetX;
        const y = event.y - boardRect.top - offsetY;

        const [row, column] = getTileLocation(x, y, tileSize);

        const lengths = getShipLenghts(tileSize);
        const index = Number(ship.dataset['index']);
        const length = lengths[index];

        const horizontal = ship.classList.contains('-rotate-90');

        const shipData: ShipData = { row, column, length, horizontal };

        setPlayerShipData(previous => {
          const newShipData = previous.map(data => ({ ...data }));

          return newShipData.filter(
            data => data.row != shipData.row || data.column != shipData.column,
          );
        });

        setShipBoard(previous => {
          const shipBoard = [...previous];

          removeShip(shipBoard, boardRows, boardColumns, shipData);

          return shipBoard;
        });
      }

      dragging = { ship, offsetX, offsetY };
      ship.classList.remove('-rotate-90', 'origin-[top_center]');
      document.body.append(ship);

      documentMousemouseEvent(event);
    };

    const documentMouseupEvent = (event: globalThis.MouseEvent): void => {
      if (!dragging) return;

      const { ship, offsetX, offsetY } = dragging;

      if (valid) {
        const boardRect = shipContainer.getBoundingClientRect();

        const tileSize = computeTileSize();
        const x = event.x - boardRect.left - offsetX;
        const y = event.y - boardRect.top - offsetY;

        const [row, column] = getTileLocation(x, y, tileSize);

        const [left, top] = centerPointToTile(
          column * tileSize,
          row * tileSize,
          ship.width,
          ship.height,
          tileSize,
          false,
        );
        ship.style.left = `${left}px`;
        ship.style.top = `${top}px`;
        shipContainer.append(ship);

        const lengths = getShipLenghts(tileSize);
        const index = Number(ship.dataset['index']);
        const length = lengths[index];

        const shipData: ShipData = { row, column, length, horizontal: false };

        setPlayerShipData(previous => {
          const newShipData = previous.map(data => ({ ...data }));

          newShipData.push(shipData);

          return newShipData;
        });

        setShipBoard(previous => {
          const shipBoard = [...previous];

          placeShip(shipBoard, boardRows, boardColumns, shipData);

          return shipBoard;
        });
      } else {
        const index = Number(ship.dataset['index']);
        const shipPlaceholder = shipPlaceholders[index];

        ship.style.left = '';
        ship.style.top = '';
        shipPlaceholder.append(ship);
      }

      dragging = false;
      valid = false;
    };

    const eventOptions: AddEventListenerOptions = {
      passive: true /* enable performance optimizations */,
    };

    for (const ship of ships) {
      ship.addEventListener('mousedown', shipMousedownEvent, eventOptions);
    }

    document.addEventListener('mousemove', documentMousemouseEvent, eventOptions);
    document.addEventListener('mouseup', documentMouseupEvent, eventOptions);

    const dispose = (): void => {
      for (const ship of ships) {
        ship.removeEventListener('mousedown', shipMousedownEvent, eventOptions);
      }

      document.removeEventListener('mousemove', documentMousemouseEvent, eventOptions);
      document.removeEventListener('mouseup', documentMouseupEvent, eventOptions);
    };

    playButton.addEventListener('click', dispose, eventOptions);

    return (): void => {
      dispose();

      playButton.removeEventListener('click', dispose, eventOptions);
    };
  }, []);

  useEffect(() => {
    const playButton = playButtonRef.current!;

    if (playerShipData.length == shipInfo.length) {
      playButton.classList.remove('pointer-events-none', 'opacity-25');
      return;
    }

    playButton.classList.add('pointer-events-none', 'opacity-25');
  }, [playerShipData]);

  useEffect(() => {
    (async (): Promise<void> => {
      if (gameState == 'ship-select') return;

      const shipContainer = shipContainerRef.current!;

      if (gameState == 'player-select') {
        shipContainer.classList.add('invisible');
        return;
      }

      shipContainer.classList.remove('invisible');

      const tileSize = computeTileSize();
      const shipLenghts = getShipLenghts(tileSize);

      const [row, column] = enemyAI(enemyBoard, boardRows, boardColumns, shipLenghts);
      const index = getIndex(row, column, boardColumns);

      await wait(750);

      const hitInfo = canHitShip(row, column, playerShipData);

      setEnemyBoard(previous => {
        const enemyBoard = [...previous];

        enemyBoard[index] = hitInfo;

        return enemyBoard;
      });

      await wait(1500);

      setGameState('player-select');
    })();
  }, [gameState]);

  const playerBoardClick = async (
    event: MouseEvent<HTMLDivElement, globalThis.MouseEvent>,
  ): Promise<void> => {
    const shipContainer = shipContainerRef.current!;
    const boardRect = shipContainer.getBoundingClientRect();

    const tileSize = computeTileSize();
    const x = event.clientX - boardRect.left;
    const y = event.clientY - boardRect.top;

    const [row, column] = getTileLocation(x, y, tileSize);
    const index = getIndex(row, column, boardColumns);

    const hitInfo = canHitShip(row, column, enemyShipData);

    setPlayerBoard(previous => {
      const playerBoard = [...previous];

      playerBoard[index] = hitInfo;

      return playerBoard;
    });

    await wait(1500);

    setGameState('enemy-select');
  };

  const playGame = (): void => {
    const playButton = playButtonRef.current!;
    const shuffleButton = shuffleButtonRef.current!;
    const deleteButton = deleteButtonRef.current!;

    playButton.classList.add('pointer-events-none', 'opacity-25');
    shuffleButton.classList.add('pointer-events-none', 'opacity-25');
    deleteButton.classList.add('pointer-events-none', 'opacity-25');

    const tileSize = computeTileSize();
    const shipLenghts = getShipLenghts(tileSize);

    const [enemyShipData] = generateRandomShipData(boardRows, boardColumns, shipLenghts);
    setEnemyShipData(enemyShipData);

    setGameState(Math.random() > 0.0 ? 'player-select' : 'enemy-select');
  };

  const deleteShips = (): void => {
    const ships = shipsRef.current as HTMLImageElement[];
    const shipPlaceholders = shipPlaceholdersRef.current as HTMLDivElement[];

    for (const ship of ships) {
      const index = Number(ship.dataset['index']);
      const shipPlaceholder = shipPlaceholders[index];

      ship.style.left = '';
      ship.style.top = '';
      ship.classList.remove('-rotate-90', 'origin-[top_center]');
      shipPlaceholder.append(ship);
    }

    setPlayerShipData([]);
    setShipBoard(generateShipBoard(boardRows, boardColumns));
  };

  const shuffleShips = (): void => {
    deleteShips();

    const tileSize = computeTileSize();
    const shipLenghts = getShipLenghts(tileSize);

    const [shipData, shipBoard] = generateRandomShipData(boardRows, boardColumns, shipLenghts);

    const shipContainer = shipContainerRef.current!;

    shipData.forEach((data, index) => {
      const ship = shipsRef.current[index]!;

      const [left, top] = centerPointToTile(
        data.column * tileSize,
        data.row * tileSize,
        ship.width,
        ship.height,
        tileSize,
        data.horizontal,
      );

      ship.style.left = `${left}px`;
      ship.style.top = `${top}px`;

      if (data.horizontal) {
        ship.classList.add('-rotate-90', 'origin-[top_center]');
      }

      shipContainer.append(ship);
    });

    setPlayerShipData(shipData);
    setShipBoard(shipBoard);
  };

  return (
    <div className="grid h-full place-items-center">
      <main className="grid grid-cols-[1fr_5fr_1fr] gap-8 rounded-lg bg-light-100 px-8 py-8 shadow-[8px_8px_0_0_theme(colors.dark.800)] drop-shadow-2xl lg:gap-16 lg:px-16">
        <section
          className="grid place-items-center gap-4"
          style={{ gridTemplateColumns: `repeat(${shipInfo.length / 3}, 1fr)` }}
        >
          {shipInfo.map((imageIndex, index) => (
            <div
              ref={instance => void (shipPlaceholdersRef.current[index] = instance)}
              className="relative"
              style={{
                width: shipImageInfo[imageIndex].width,
                height: shipImageInfo[imageIndex].height,
              }}
              key={index}
            >
              <Image
                ref={instance => void (shipsRef.current[index] = instance)}
                src={shipImageInfo[imageIndex].path}
                width={shipImageInfo[imageIndex].width}
                height={shipImageInfo[imageIndex].height}
                alt="Ship"
                draggable="false"
                data-index={index}
                className="absolute cursor-pointer select-none"
                style={{
                  width: shipImageInfo[imageIndex].width,
                  height: shipImageInfo[imageIndex].height,
                }}
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
                gridTemplateRows: `repeat(${boardRows}, 1fr)`,
                gridTemplateColumns: `repeat(${boardColumns}, 1fr)`,
              }}
            >
              {gameState == 'ship-select'
                ? shipBoard.map((cell, index) => (
                    <div
                      className={`${cell == 'hover' ? 'bg-light-400' : ''} ${cell == 'full' ? 'bg-orange-200' : ''} ${cell == 'border' ? 'bg-orange-300' : ''} border border-dark-800`}
                      key={index}
                    ></div>
                  ))
                : null}

              {gameState == 'player-select'
                ? playerBoard.map((cell, index) => (
                    <div
                      className={`${cell == 'hidden' ? 'cursor-pointer hover:bg-light-400' : ''} ${cell == 'empty' ? 'bg-light-400' : ''} ${cell == 'ship-part' ? 'bg-red-500' : ''} border border-dark-800`}
                      onClick={cell == 'hidden' ? playerBoardClick : undefined}
                      key={index}
                    ></div>
                  ))
                : null}

              {gameState == 'enemy-select'
                ? enemyBoard.map((cell, index) => (
                    <div
                      className={`${cell == 'empty' ? 'bg-light-400' : ''} ${cell == 'ship-part' ? 'bg-red-500' : ''} border border-dark-800`}
                      key={index}
                    ></div>
                  ))
                : null}

              <div
                ref={shipContainerRef}
                className="absolute h-full w-full overflow-hidden"
              ></div>
            </div>
          </div>
        </div>

        <section className="flex flex-col justify-around gap-4 px-1">
          <BoardButton
            ref={playButtonRef}
            color="blue"
            icon={<PlayIcon strokeWidth={2.8} />}
            disableOnSetup={true}
            title="Start the game"
            onClick={playGame}
          />
          <BoardButton
            ref={shuffleButtonRef}
            color="green"
            icon={<ShuffleIcon strokeWidth={2.8} />}
            title="Shuffle ships in random order"
            onClick={shuffleShips}
          />
          <BoardButton
            ref={deleteButtonRef}
            color="red"
            icon={<Trash2Icon strokeWidth={2.8} />}
            title="Delete all ships from the board"
            onClick={deleteShips}
          />
        </section>
      </main>
    </div>
  );
}
