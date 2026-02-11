type BusboyHandler = {
  on: (event: string, cb: (...args: any[]) => void) => void;
};

export default function Busboy(): BusboyHandler {
  return {
    on: () => undefined,
  };
}
