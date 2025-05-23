type Success<T> = readonly [data: T, error: null];
type Failure<E> = readonly [data: null, error: E];
type ResultSync<T, E> = Success<T> | Failure<E>
type ResultAsync<T, E> = Promise<ResultSync<T, E>>

export function tryCatch<T, E = Error>(operation: Promise<T>): ResultAsync<T, E>
export function tryCatch<T, E = Error>(operation: () => T): ResultSync<T, E>
export function tryCatch<T, E = Error>(operation: Promise<T> | (() => T)): ResultSync<T, E> | ResultAsync<T, E> {
  if (operation instanceof Promise) {
    return operation.then((value: T) => [value, null] as const).catch((error: E) => [null, error] as const)
  }

  try {
    const data = operation()
    return [data, null] as const;
  } catch (error) {
    return [null, error as E] as const;
  }
}