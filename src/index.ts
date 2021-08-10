import { SWR, SWRKey, SWROptions, SWRMutateOptions, SWRRevalidateOptions, CacheClearOptions } from 'swrev'
import { onDestroy, onMount } from 'svelte'
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
    let unsubscribe: undefined | (() => void) = undefined

    // Contains the data and errors stores.
    const data = writable<D | undefined>(undefined, () => () => unsubscribe?.())
    const error = writable<E | undefined>(undefined, () => () => unsubscribe?.())

    // Stores the unsubscription handler
    onMount(() => {
      // Set the data of the writable.
      data.set(this.get<D>(this.resolveKey(key)))

      // Handlers that will be executed when data changes.
      const onData = (d: D) => data.set(d)
      const onError = (e: E) => error.set(e)

      // Subscribe and use the SWR fetch using the given key.
      unsubscribe = this.use<D, E>(key, onData, onError, {
        loadInitialCache: false,
        ...options,
      }).unsubscribe
    })

    // Cleanup code to unsubscribe.
    onDestroy(() => unsubscribe?.())

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
 * Creates a new SWR instance and exports basic methods to
 * work with without the need for method calling.
 */
export const createSWR = <G = unknown>(options?: Partial<SWROptions<G>>) => {
  const swr = new SSWR(options)
  return {
    useSWR: <D = G, E = Error>(key: SWRKey, options?: Partial<SWROptions<D>>) => swr.useSvelte<D, E>(key, options),
    mutate: <D = G>(key: SWRKey, value: D, options?: Partial<SWRMutateOptions<D>>) =>
      swr.mutate<D>(key, value, options),
    revalidate: <D = G>(key: SWRKey, options?: Partial<SWRRevalidateOptions<D>>) => swr.revalidate<D>(key, options),
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
