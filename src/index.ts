import { SWR, SWRKey, SWROptions, SWRMutateOptions, SWRRevalidateOptions, CacheClearOptions } from 'swrev'
import { onDestroy } from 'svelte'
import { writable } from 'svelte/store'

/**
 * Exports the extended SWR class with an extra method
 * build for svelte.
 */
export class SSWR extends SWR {
  /**
   * Svelte specific use of SWR.
   */
  useSvelte<D = any, E = Error>(
    key: SWRKey | undefined | (() => SWRKey | undefined),
    options?: Partial<SWROptions<D>>
  ) {
    // Stores the unsubscription handler
    let unsubscribe = () => {}

    // Contains the data and errors stores.
    const data = writable<D | undefined>(this.get<D>(this.resolveKey(key)), () => () => unsubscribe())
    const error = writable<E | undefined>(undefined, () => () => unsubscribe())

    // Handlers that will be executed when data changes.
    const onData = (d: D) => data.set(d)
    const onError = (e: E) => error.set(e)

    // Subscribe and use the SWR fetch using the given key.
    unsubscribe = this.use<D, E>(key, onData, onError, {
      loadInitialCache: false,
      ...options,
    }).unsubscribe

    // Cleanup code to unsubscribe.
    onDestroy(() => unsubscribe())

    // Mutates the current key.
    const mutate = (value: D, options: Partial<SWRMutateOptions<D>>) => {
      return this.mutate(this.resolveKey(key), value, options)
    }

    // Revalidates the current key.
    const revalidate = (options: Partial<SWRRevalidateOptions<D>>) => {
      return this.revalidate(this.resolveKey(key), options)
    }

    // Clears the current key from cache.
    const clear = (options: Partial<CacheClearOptions>) => {
      return this.clear(this.resolveKey(key), options)
    }

    // Return the needed items.
    return { data, error, mutate, revalidate, clear }
  }
}

/**
 * Creates a mew SWR instance and exports basic methods to
 * work with without the need for method calling.
 */
export const createSWR = <D>(options?: Partial<SWROptions<D>>) => {
  const swr = new SSWR(options)
  return {
    useSWR: (key: SWRKey, options?: Partial<SWROptions<D>>) => swr.useSvelte(key, options),
    mutate: (key: SWRKey, value: D, options?: Partial<SWRMutateOptions<D>>) => swr.mutate(key, value, options),
    revalidate: (key: SWRKey, options?: Partial<SWRRevalidateOptions<D>>) => swr.revalidate(key, options),
    clear: (keys?: string | string[], options?: Partial<CacheClearOptions>) => swr.clear(keys, options),
  }
}

// Default SWR instance to play with.
const swr = createSWR()

// Default instance exports.
export const useSWR = swr.useSWR
export const mutate = swr.mutate
export const revalidate = swr.revalidate
export const clear = swr.clear
