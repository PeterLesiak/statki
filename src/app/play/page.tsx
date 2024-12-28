'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CircleChevronLeftIcon, PlayIcon } from 'lucide-react';

export default function Play() {
  const [width, setWidth] = useState(14);
  const [height, setHeight] = useState(14);
  const [board, setBoard] = useState<boolean[][]>([]);

  useEffect(() => {
    setBoard(Array(width * height).fill(false));
  }, [width, height]);

  return (
    <div className="grid h-full place-items-center">
      <main className="rounded-lg bg-light-200 p-8 shadow-[8px_8px_0_0_theme(colors.dark.800)] drop-shadow-2xl">
        <div className="flex flex-col gap-4">
          <header className="flex items-center justify-between gap-10">
            <Link
              href="/"
              className="flex gap-2 rounded-md border-2 border-dark-800 px-4 py-2 font-semibold transition-colors ease-out hover:border-orange-200 hover:bg-orange-500 hover:text-light"
            >
              <CircleChevronLeftIcon strokeWidth={2.5} />
              POWRÓT
            </Link>
            <h2 className="text-3xl">Rozmieść jednostki na planszy</h2>
            <button className="flex gap-2 rounded-md border-2 border-dark-800 px-4 py-2 font-semibold transition-colors ease-out hover:border-orange-200 hover:bg-orange-500 hover:text-light">
              <PlayIcon strokeWidth={2.5} />
              GOTOWE
            </button>
          </header>

          <div className="flex justify-center p-5">
            <div
              className="grid aspect-square h-[30rem] rounded border-2 border-dark-800"
              style={{
                gridTemplateRows: `repeat(${width}, minmax(0, 1fr))`,
                gridTemplateColumns: `repeat(${height}, minmax(0, 1fr))`,
              }}
            >
              {board.map((cell, index) => (
                <div className="cursor-pointer border border-dark-800" key={index}></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
