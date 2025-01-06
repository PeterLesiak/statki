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

import { randomBoolean, randomInteger, randomItem, wait } from '@/utils';

type ImageInfo = { path: string; width: number; height: number };

const shipImageInfo: ImageInfo[] = [
  { path: '/images/Ship 1 - Full.webp', width: 30, height: 81 },
  { path: '/images/Ship 2 - Full.webp', width: 30, height: 115 },
  { path: '/images/Ship 3 - Full.webp', width: 30, height: 150 },
  { path: '/images/Ship 4 - Full.webp', width: 30, height: 176 },
];

const resizeShipImage = (imageInfo: ImageInfo, tileSize: number): [number, number] => {
  const width = (imageInfo.width / 34) * tileSize;
  const height = width * (imageInfo.height / imageInfo.width);

  return [width, height];
};

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

export const getRowColumn = (index: number, boardColumns: number): [number, number] => {
  const row = Math.floor(index / boardColumns);
  const column = index % boardColumns;

  return [row, column];
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
      const horizontal = randomBoolean();
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

type BoardCell = 'hidden' | 'empty' | 'ship-part' | 'ship-all';

const generateBoard = (boardRows: number, boardColumns: number): BoardCell[] => {
  const board = Array<BoardCell>(boardRows * boardColumns);

  return board.fill('hidden');
};

const hitBoard = (
  board: BoardCell[],
  boardRows: number,
  boardColumns: number,
  hitRow: number,
  hitColumn: number,
  ships: ShipData[],
): BoardCell[] => {
  const newBoard = [...board];

  for (const ship of ships) {
    let found: boolean = false;
    let hitAll: boolean = true;

    for (let i = 0; i < ship.length; ++i) {
      const row = ship.row + (ship.horizontal ? 0 : i);
      const column = ship.column + (ship.horizontal ? i : 0);
      const index = getIndex(row, column, boardColumns);

      if (row == hitRow && column == hitColumn) {
        newBoard[index] = 'ship-part';
        found = true;
      }

      if (newBoard[index] == 'hidden') {
        hitAll = false;
      }
    }

    if (!found) continue;

    if (!hitAll) {
      return newBoard;
    }

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
          newBoard[index] = 'ship-all';
          continue;
        }

        newBoard[index] = 'empty';
      }
    }

    return newBoard;
  }

  const index = getIndex(hitRow, hitColumn, boardColumns);
  newBoard[index] = 'empty';

  return newBoard;
};

const enemyAI = (
  board: BoardCell[],
  boardRows: number,
  boardColumns: number,
  shipLengths: number[],
): [number, number] => {
  type Direction = 'left' | 'right' | 'top' | 'down';

  const getCell = (row: number, column: number): BoardCell => {
    return board[getIndex(row, column, boardColumns)];
  };

  const isValid = (row: number, column: number): boolean => {
    return row >= 0 && row < boardRows && column >= 0 && column < boardColumns;
  };

  const invertDirection = (direction: Direction): Direction => {
    switch (direction) {
      case 'left':
        return 'right';
      case 'right':
        return 'left';
      case 'top':
        return 'down';
      case 'down':
        return 'top';
    }
  };

  const moveInDirection = (
    row: number,
    column: number,
    distance: number,
    direction: Direction,
  ): [number, number] => {
    switch (direction) {
      case 'left':
        return [row, column - distance];
      case 'right':
        return [row, column + distance];
      case 'top':
        return [row - distance, column];
      case 'down':
        return [row + distance, column];
    }
  };

  const isAround = (row: number, column: number, cell: BoardCell): Direction | false => {
    if (row > 0 && getCell(row - 1, column) == cell) {
      return 'top';
    }

    if (row < boardRows - 1 && getCell(row + 1, column) == cell) {
      return 'down';
    }

    if (column > 0 && getCell(row, column - 1) == cell) {
      return 'left';
    }

    if (column < boardColumns - 1 && getCell(row, column + 1) == cell) {
      return 'right';
    }

    return false;
  };

  const getDistance = (row: number, column: number, direction: Direction): number => {
    const firstCell = getCell(row, column);
    let distance: number = 0;

    while (true) {
      row += direction == 'top' ? -1 : direction == 'down' ? 1 : 0;
      column += direction == 'left' ? -1 : direction == 'right' ? 1 : 0;

      if (!isValid(row, column)) break;

      const cell = getCell(row, column);

      if (cell != firstCell) break;

      distance += 1;
    }

    return distance;
  };

  const bestMoveWithTwoShipParts = (
    originRow: number,
    originColumn: number,
    startDirection: Direction,
  ): [number, number] => {
    const [shipRowStart, shipColumnStart] = moveInDirection(
      originRow,
      originColumn,
      getDistance(originRow, originColumn, startDirection),
      startDirection,
    );
    const [rowStartBorder, columnStartBorder] = moveInDirection(
      shipRowStart,
      shipColumnStart,
      1,
      startDirection,
    );

    let startBorderDistance: number = -1;
    if (
      isValid(rowStartBorder, columnStartBorder) &&
      getCell(rowStartBorder, columnStartBorder) == 'hidden'
    ) {
      startBorderDistance = getDistance(rowStartBorder, columnStartBorder, startDirection);
    }

    const endDirection = invertDirection(startDirection);
    const [shipRowEnd, shipColumnEnd] = moveInDirection(
      originRow,
      originColumn,
      getDistance(originRow, originColumn, endDirection),
      endDirection,
    );
    const [rowEndBorder, columnEndBorder] = moveInDirection(
      shipRowEnd,
      shipColumnEnd,
      1,
      endDirection,
    );

    let endBorderDistance: number = -1;
    if (
      isValid(rowEndBorder, columnEndBorder) &&
      getCell(rowEndBorder, columnEndBorder) == 'hidden'
    ) {
      endBorderDistance = getDistance(rowEndBorder, columnEndBorder, endDirection);
    }

    if (startBorderDistance > endBorderDistance) {
      return [rowStartBorder, columnStartBorder];
    }

    if (endBorderDistance > startBorderDistance) {
      return [rowEndBorder, columnEndBorder];
    }

    if (randomBoolean()) {
      return [rowStartBorder, columnStartBorder];
    }

    return [rowEndBorder, columnEndBorder];
  };

  const bestMoveWithOneShipPart = (
    originRow: number,
    originColumn: number,
    horizontalProbability: number = 0.25,
  ): [number, number] => {
    const [leftRow, leftColumn] = moveInDirection(originRow, originColumn, 1, 'left');
    const [rightRow, rightColumn] = moveInDirection(originRow, originColumn, 1, 'right');
    const [topRow, topColumn] = moveInDirection(originRow, originColumn, 1, 'top');
    const [downRow, downColumn] = moveInDirection(originRow, originColumn, 1, 'down');

    let leftDistance = -1;
    if (isValid(leftRow, leftColumn) && getCell(leftRow, leftColumn) == 'hidden') {
      leftDistance = getDistance(leftRow, leftColumn, 'left');
    }

    let rightDistance = -1;
    if (isValid(rightRow, rightColumn) && getCell(rightRow, rightColumn) == 'hidden') {
      rightDistance = getDistance(rightRow, rightColumn, 'right');
    }

    let topDistance = -1;
    if (isValid(topRow, topColumn) && getCell(topRow, topColumn) == 'hidden') {
      topDistance = getDistance(topRow, topColumn, 'top');
    }

    let downDistance = -1;
    if (isValid(downRow, downColumn) && getCell(downRow, downColumn) == 'hidden') {
      downDistance = getDistance(downRow, downColumn, 'down');
    }

    const selectLargest = (): Direction => {
      const distances: { direction: Direction; value: number }[] = [
        { direction: 'left', value: leftDistance },
        { direction: 'right', value: rightDistance },
        { direction: 'top', value: topDistance },
        { direction: 'down', value: downDistance },
      ];

      const maxDistance = Math.max(leftDistance, rightDistance, topDistance, downDistance);
      const candidates = distances.filter(d => d.value == maxDistance);
      const horizontal = candidates.filter(
        d => d.direction == 'left' || d.direction == 'right',
      );
      const vertical = candidates.filter(d => d.direction == 'top' || d.direction == 'down');

      if (horizontal.length > 0 && vertical.length > 0) {
        const isHorizontalChosen = Math.random() < horizontalProbability;

        if (isHorizontalChosen && horizontal.length > 0) {
          return randomItem(horizontal).direction;
        }

        return randomItem(vertical).direction;
      }

      return randomItem(candidates).direction;
    };

    switch (selectLargest()) {
      case 'left':
        return [leftRow, leftColumn];
      case 'right':
        return [rightRow, rightColumn];
      case 'top':
        return [topRow, topColumn];
      case 'down':
        return [downRow, downColumn];
    }
  };

  const bestMoveWithZeroShipParts = (): [number, number] => {
    const probabilities = Array<number>(board.length).fill(0);

    for (const shipLength of shipLengths) {
      for (let row = 0; row < boardRows; ++row) {
        for (let column = 0; column < boardColumns; ++column) {
          if (column + shipLength <= boardColumns) {
            let canPlace = true;

            for (let i = 0; i < shipLength; ++i) {
              const cell = getCell(row, column + i);

              if (cell != 'hidden') {
                canPlace = false;
                break;
              }
            }

            if (canPlace) {
              for (let i = 0; i < shipLength; ++i) {
                const index = getIndex(row, column + i, boardColumns);
                probabilities[index] += 1;
              }
            }
          }

          if (row + shipLength <= boardRows) {
            let canPlace = true;

            for (let i = 0; i < shipLength; ++i) {
              const cell = getCell(row + i, column);

              if (cell != 'hidden') {
                canPlace = false;
                break;
              }
            }

            if (canPlace) {
              for (let i = 0; i < shipLength; ++i) {
                const index = getIndex(row + i, column, boardColumns);
                probabilities[index] += 1;
              }
            }
          }
        }
      }
    }

    const normalizeEdgeFactor = (row: number, column: number): number => {
      const rowDistance = Math.min(row, boardRows - row - 1);
      const colDistance = Math.min(column, boardColumns - column - 1);

      return Math.min(rowDistance + 1, colDistance + 1) * 2;
    };

    const randomFactor = (): number => {
      return Math.random();
    };

    for (let row = 0; row < boardRows; row++) {
      for (let col = 0; col < boardColumns; col++) {
        const index = getIndex(row, col, boardColumns);

        probabilities[index] =
          randomFactor() + probabilities[index] * normalizeEdgeFactor(row, col);
      }
    }

    let maxProbability = 0;
    let bestMove: [number, number] = [0, 0];

    for (let i = 0; i < probabilities.length; i++) {
      if (board[i] == 'hidden' && probabilities[i] > maxProbability) {
        maxProbability = probabilities[i];
        bestMove = getRowColumn(i, boardColumns);
      }
    }

    return bestMove;
  };

  let shipPart: [number, number] | null = null;

  for (let row = 0; row < boardRows; ++row) {
    for (let column = 0; column < boardColumns; ++column) {
      if (getCell(row, column) == 'ship-part') {
        shipPart = [row, column];
        break;
      }
    }

    if (shipPart) break;
  }

  if (shipPart) {
    const [originRow, originColumn] = shipPart;
    const nextPartDirection = isAround(originRow, originColumn, 'ship-part');

    if (nextPartDirection) {
      return bestMoveWithTwoShipParts(originRow, originColumn, nextPartDirection);
    }

    return bestMoveWithOneShipPart(originRow, originColumn);
  }

  return bestMoveWithZeroShipParts();
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
      const [_, height] = resizeShipImage(imageInfo, tileSize);

      return Math.ceil(height / tileSize);
    });
  };

  useEffect(() => {
    const ships = [...shipsRef.current] as HTMLImageElement[];
    const shipPlaceholders = [...shipPlaceholdersRef.current] as HTMLDivElement[];
    const shipContainer = shipContainerRef.current!;
    const playButton = playButtonRef.current!;

    let dragging: { ship: HTMLImageElement; offsetX: number; offsetY: number } | false = false;
    let valid: boolean = false;

    const documentPointermoveEvent = (event: PointerEvent): void => {
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

        const x = event.x - boardRect.left - offsetX;
        const y = event.y - boardRect.top - offsetY;

        const tileSize = computeTileSize();

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

    const shipPointerdownEvent = (event: PointerEvent): void => {
      const ship = event.target as HTMLImageElement;

      const shipRect = ship.getBoundingClientRect();
      const boardRect = shipContainer.getBoundingClientRect();

      const tileSize = computeTileSize();

      const index = Number(ship.dataset['index']);

      const offsetX = event.x - shipRect.left;
      const offsetY = event.y - shipRect.top;

      if (ship.parentElement == shipContainer) {
        const x = event.x - boardRect.left - offsetX;
        const y = event.y - boardRect.top - offsetY;

        const [row, column] = getTileLocation(x, y, tileSize);

        const lengths = getShipLenghts(tileSize);
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

      const imageInfo = shipImageInfo[shipInfo[index]];
      const [width, height] = resizeShipImage(imageInfo, tileSize);
      ship.style.width = `${width}px`;
      ship.style.height = `${height}px`;

      ship.classList.add('brightness-125');
      ship.classList.remove('-rotate-90', 'origin-[top_center]');

      document.body.style.userSelect = 'none';
      document.body.append(ship);

      documentPointermoveEvent(event);
    };

    const documentPointerupEvent = (event: PointerEvent): void => {
      if (!dragging) return;

      const { ship, offsetX, offsetY } = dragging;

      const index = Number(ship.dataset['index']);

      if (valid) {
        const boardRect = shipContainer.getBoundingClientRect();

        const x = event.x - boardRect.left - offsetX;
        const y = event.y - boardRect.top - offsetY;

        const tileSize = computeTileSize();

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
        const shipPlaceholder = shipPlaceholders[index];

        const imageInfo = shipImageInfo[shipInfo[index]];
        ship.style.width = `${imageInfo.width}px`;
        ship.style.height = `${imageInfo.height}px`;

        ship.style.left = '';
        ship.style.top = '';
        shipPlaceholder.append(ship);
      }

      dragging = false;
      valid = false;

      ship.classList.remove('brightness-125');
      document.body.style.userSelect = 'auto';
    };

    const eventOptions: AddEventListenerOptions = {
      passive: true /* enable performance optimizations */,
    };

    for (const ship of ships) {
      ship.addEventListener('pointerdown', shipPointerdownEvent, eventOptions);
    }

    document.addEventListener('pointermove', documentPointermoveEvent, eventOptions);
    document.addEventListener('pointerup', documentPointerupEvent, eventOptions);

    const dispose = (): void => {
      for (const ship of ships) {
        ship.removeEventListener('pointerdown', shipPointerdownEvent, eventOptions);
      }

      document.removeEventListener('pointermove', documentPointermoveEvent, eventOptions);
      document.removeEventListener('pointerup', documentPointerupEvent, eventOptions);
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

  const enemyTurn = async (): Promise<void> => {
    const tileSize = computeTileSize();
    const shipLenghts = getShipLenghts(tileSize);

    await wait(500);

    setEnemyBoard(previous => {
      const enemyBoard = [...previous];

      const [row, column] = enemyAI(enemyBoard, boardRows, boardColumns, shipLenghts);

      const newBoard = hitBoard(
        enemyBoard,
        boardRows,
        boardColumns,
        row,
        column,
        playerShipData,
      );

      return newBoard;
    });

    await wait(1000);

    setGameState('player-select');
  };

  useEffect(() => {
    if (gameState == 'ship-select') return;

    const shipContainer = shipContainerRef.current!;

    if (gameState == 'player-select') {
      shipContainer.classList.add('invisible');
    }

    if (gameState == 'enemy-select') {
      shipContainer.classList.remove('invisible');
      enemyTurn();
    }
  }, [gameState]);

  const playerBoardClick = async (
    event: MouseEvent<HTMLDivElement, globalThis.MouseEvent>,
  ): Promise<void> => {
    const shipContainer = shipContainerRef.current!;
    const boardRect = shipContainer.getBoundingClientRect();

    const x = event.clientX - boardRect.left;
    const y = event.clientY - boardRect.top;

    const tileSize = computeTileSize();
    const [row, column] = getTileLocation(x, y, tileSize);

    const newBoard = hitBoard(
      playerBoard,
      boardRows,
      boardColumns,
      row,
      column,
      enemyShipData,
    );
    setPlayerBoard(newBoard);

    await wait(1000);

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

    setGameState(randomBoolean() ? 'player-select' : 'enemy-select');
  };

  const deleteShips = (): void => {
    const ships = shipsRef.current as HTMLImageElement[];
    const shipPlaceholders = shipPlaceholdersRef.current as HTMLDivElement[];

    for (const ship of ships) {
      const index = Number(ship.dataset['index']);
      const shipPlaceholder = shipPlaceholders[index];
      const imageInfo = shipImageInfo[shipInfo[index]];

      ship.style.width = `${imageInfo.width}px`;
      ship.style.height = `${imageInfo.height}px`;
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
      const imageInfo = shipImageInfo[shipInfo[index]];
      const [width, height] = resizeShipImage(imageInfo, tileSize);

      ship.style.width = `${width}px`;
      ship.style.height = `${height}px`;

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
    <div className="grid h-dvh place-items-center">
      <main className="flex h-full w-full flex-col bg-light-100 sm:w-auto sm:rounded-lg sm:px-16 sm:drop-shadow-2xl lg:h-auto lg:flex-row lg:gap-16 lg:py-8 lg:shadow-[8px_8px_0_0_theme(colors.dark.800)]">
        <section className="mb-10 grid grid-cols-6 place-items-center sm:mb-0 lg:grid-cols-2 lg:gap-10">
          {shipInfo.map((imageIndex, index) => (
            <div
              ref={instance => void (shipPlaceholdersRef.current[index] = instance)}
              className="relative scale-75 lg:scale-100"
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

        <div className="flex flex-col justify-center">
          <h2 className="mb-6 w-full text-center text-xl sm:text-3xl lg:mb-8">
            Rozmieść jednostki na planszy
          </h2>

          <div className="flex justify-center">
            <div
              id="tile-grid"
              className="relative grid aspect-square h-[20rem] rounded border-2 border-dark-800 sm:h-[30rem]"
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
                      className={`${cell == 'hidden' ? 'cursor-pointer hover:bg-light-400' : ''} ${cell == 'empty' ? 'bg-light-400' : ''} ${cell == 'ship-part' ? 'bg-red-500' : ''} ${cell == 'ship-all' ? 'bg-red-500' : ''} border border-dark-800`}
                      onClick={cell == 'hidden' ? playerBoardClick : undefined}
                      key={index}
                    ></div>
                  ))
                : null}

              {gameState == 'enemy-select'
                ? enemyBoard.map((cell, index) => (
                    <div
                      className={`${cell == 'empty' ? 'bg-light-400' : ''} ${cell == 'ship-part' ? 'bg-red-500' : ''} ${cell == 'ship-all' ? 'bg-red-500' : ''} border border-dark-800`}
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

        <section className="my-auto flex justify-around lg:my-0 lg:w-[5rem] lg:flex-col">
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
