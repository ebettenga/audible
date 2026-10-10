export class PlaycallError extends Error {
  readonly index: number;
  readonly token: string;

  constructor(message: string, index: number, token: string) {
    super(message);
    this.name = 'PlaycallError';
    this.index = index;
    this.token = token;
  }
}
