import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

export const useLocalStorage = <T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const store = localStorage.getItem(key);

    if (store) {
      setValue(JSON.parse(store));
    } else {
      setValue(initialValue);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [value]);

  return [value, setValue];
};