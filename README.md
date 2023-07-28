# SSWR (Svelte Stale While Revalidate)

> Svelte stale while revalidate (SWR) data fetching strategy

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Configuration options](#configuration-options)
- [Global configuration options](#global-configuration-options)
- [Dependent fetching](#dependent-fetching)
- [Re-validate on demand](#re-validate-on-demand)
- [Mutate on demand](#mutate-on-demand)
- [Error handling](#error-handling)
- [Clear Cache](#clear-cache)
- [Using with SvelteKit SSR](#using-with-sveltekit-ssr)
- [Contributors](#contributors)

## Introduction

Quote from [vercel's SWR](https://swr.vercel.app/) for react:

> The name “SWR” is derived from stale-while-revalidate, a HTTP cache invalidation strategy popularized by
> [HTTP RFC 5861](https://tools.ietf.org/html/rfc5861). SWR is a strategy to first return the data from cache
> (stale), then send the fetch request (revalidate), and finally come with the up-to-date data.
>
> With SWR, components will get a stream of data updates constantly and automatically.
> And the UI will be always fast and reactive.

## Features

- :tada: &nbsp; Built for **Svelte**
- :fire: &nbsp; **Extremely small and well packed** at 2KB.
- :fire: &nbsp; **No dependencies (one polyfill for EventTarget)**.
- :+1: &nbsp; Built-in **cache** and request deduplication.
- :eyes: &nbsp; **Dependent fetching** of data that depends on other.
- :eyes: &nbsp; **Real time** experience.
- :star: &nbsp; **Typescript** friendly.
- :+1: &nbsp; **Error handling** by using the error variable provided.
- :zap: &nbsp; **Efficient DOM** updates using Svelte reactivity.
- :zap: &nbsp; **Efficient HTTP** requests are only done when needed.
- :+1: &nbsp; **Manual revalidation** of the data by using `revalidate()`.
- :+1: &nbsp; **Optimistic UI / Manual mutation** of the data by using `mutate()`.
- :zzz: &nbsp; **Window focus revalidation** of the data.
- :zzz: &nbsp; **Network change revalidation** of the data.
- :+1: &nbsp; **Initial data** support for initial or offline data.
- :+1: &nbsp; **Clear cache** when you need to invalidate all data or the specified keys (eg. a user logout).
- :zzz: &nbsp; **Offline support** to be used without any revalidations with string keys.
- :+1: &nbsp; **Global configuration** available or per hook call.

## Installation

You can use npm or yarn to install it.

```
npm i sswr
```

```
yarn add sswr
```

## Getting Started

```svelte
<script>
  import { useSWR } from "sswr";
  // Call the `useSWR` and pass the key you want to use. It will be pased
  // to the fetcher function. The fetcher function can be configured globally
  // or passed as one of the options to this function.
  const { data: posts } = useSWR("https://jsonplaceholder.typicode.com/posts");
</script>

{#if $posts}
  {#each $posts as post (post.id)}
    <h1>{post.title}</h1>
    <p>{post.body}</p>
  {/each}
{/if}
```

This is a simple example that will use SWR as the strategy to fetch the data. In this particular case,
all the default options are used (or the ones specified in the global config) and it will fetch the data
using the default or global fetcher and update the DOM when the request is done.

## Configuration options

All hook calls can have their respective configuration options applied to it. Nevertheless you can also
configure global options to avoid passing them to each hook call.

### Signature

```js
function useSWR(key, options): SWRResponse
// Can be destructured to get the response as such:
const { data, error, mutate, revalidate } = useSWR(key, options)
```

#### Parameters

- `key`: A resolved or non-resolved key. Can either be a string, or a function. A function can be used for dependent fetching as seen below.
- `options`: An optional object with optional properties such as:
  - `cache: SWRCache = new DefaultCache()`: Determines the cache to use for SWR.
  - `errors: EventTarget = new EventTarget()`: Determines the error event target where the errors will be dispatched.
  - `fetcher: (key) => Promise<any> = (url) => fetch(url).then((res) => res.json())`: Determines the fetcher function to use.
    This will be called to get the data.
  - `initialData: any = undefined`: Represents the initial data to use instead of undefined. Keep in mind the component will still attempt to re-validate
    unless `revalidateOnMount` is set false.
  - `revalidateOnStart: boolean = true`: Determines if the hook should revalidate the key when it is called.
  - `dedupingInterval: number = 2000`: Determines the deduping interval. This interval represents the time SWR will avoid to perform a request if
    the last one was made before `dedupingInterval` ago.
  - `revalidateOnFocus: boolean = true`: Revalidates the data when the window re-gains focus.
  - `focusThrottleInterval: number = 5000`: Interval throttle for the focus event. This will ignore focus re-validation if it
    happened last time `focusThrottleInterval` ago.
  - `revalidateOnReconnect: boolean = true`: Revalidates the data when a network connect change is detected (basically the browser / app comes back online).

#### Return Values

- `data: Writable<D | undefined>`: Stores the data of the HTTP response after the fetcher has proceesed it or undefined in case the HTTP request hasn't finished or there was an error.
- `error: Writable<E | undefined>`: Determines error of the HTTP response in case it happened or undefined if there was no error or the HTTP request is not completed yet.
- `mutate: (value, options) => void`: Mutate alias for the global mutate function without the need to append the key to it.
- `revalidate: (options) => void`: Revalidation alias for the global revalidate function without the need to append the key to it.
- `clear: (options) => void`: Clears the current key data from the cache.
- `isLoading: Readable<boolean>`: Determines if the request is still on its way and therefore, it's still loading.
- `isValid: Readable<boolean>`: Determines if the data is valid. This means that there is no error associated with the data. This exists because errors do not wipe the data value and can still be used.

## Global configuration options

You can configure the options globally by creating a SWR instance and using it in your svelte
application. This step is not mandatory but it's recommended for most apps.

You can either choose to manually create a SWR instance and import it when needed or replace
the default SWR instance used by all exported APIs. The second is recommended if only one instance
will be needed for your application.

### Signature

```ts
function createSWR(options): VSWR
function createDefaultSWR(options): VSWR
```

#### Parameters

- `options: SWROptions`: Parameters of the options that will be passed to all components. They are the same as the ones on each `useSWR` function call.

#### Return value

A SWR instance that can be used to access all the API.

## Dependent fetching

```svelte
<script>
  import { useSWR } from "sswr";

  const { data: post } = useSWR("https://jsonplaceholder.typicode.com/posts/1");
  // We need to pass a function as the key. Function will throw an error when post is undefined
  // but we catch that and wait till it re-validates into a valid key to populate the user variable.
  $: ({ data: user } = useSWR(
    () => `https://jsonplaceholder.typicode.com/users/${$post.userId}`
  ));
</script>

{#if $post}
  <div>{$post.title}</div>
{/if}
{#if $user}
  <div>{$user.name}</div>
{/if}

```

## Re-validate on demand

### Global revalidate function with given key

You can re-validate specific keys by importing the `revalidate` function.

```js
import { revalidate } from 'sswr'
```

You can call this method anywhere in your application by giving it the key, and the options.

#### Signature

```ts
function revalidate(key, options): void
```

##### Parameters

- `key`: Determines the key that is going to be re-validated. This must be a resolved key, meaning it must be a string or undefined.
  If undefined, the function will do nothing.
- `options`: A partial object (meaning all props can be optional / undefined) that accepts the following options:
  - `force: boolean = false`:Determines if the re-validation should be forced. When a re-validation is forced, the dedupingInterval
    will be ignored and a fetch will be performed.

### On specific hooks with keys

You can re-validate specific keys by grabing the `revalidate` function of the `useSWR` call.
This function will allow you to perform a re-validation of the data on demand. There's no need
to provide the key for this function since it's already bound to the hook key. It only accepts the options.

#### Signature

```ts
function revalidate(options): void
```

##### Parameters

- `options`: Same as global revalidate (check above).

#### Example

```svelte
<script>
  import { useSWR } from 'sswr'

  const { data: post, revalidate } = useSWR('https://jsonplaceholder.typicode.com/posts/1')
</script>

{#if $post}
  <div>{$post.title}</div>
  <button on:click={() => revalidate()}>Revalidate</button>
{/if}
```

## Mutate on demand

### Global mutate function with given key

You can mutate specific keys by importing the `mutate` function.

```js
import { mutate } from 'sswr'
```

You can call this method anywhere in your application by giving it the key, the value and the options.

#### Signature

```ts
function mutate(key, value, options): void
```

##### Parameters

- `key`: Determines the key that is going to be mutated. This must be a resolved key, meaning it must be a string or undefined.
  If undefined, the function will do nothing.
- `value: any | ((any) => any)`: Determines the new value to set. This can either be the value itself or a function that receives the current
  state and returns the new one.
- `options`: A partial object (meaning all props can be optional / undefined) that accepts the following options:

  - `revalidate: boolean = true`: Determines if the mutation should attempt to revalidate the data afterwards.
  - `revalidateOptions: Partial<SWRRevalidateOptions> = { ...defaultRevalidateOptions }`: Determines the revalidation options passed to revalidate in case
    the parameter `revalidate` is set to true.

### On specific hooks with keys

You can mutate specific keys by grabing the `mutate` function of the `useSWR` call.
This function will allow you to perform a mutation of the data on demand. There's no need
to provide the key for this function since it's already bound to the hook key. It only accepts the value and the options.

#### Signature

```ts
function mutate(value, options): void
```

##### Parameters

- `value`: Same as global mutate (check above).
- `options`: Same as global mutate (check above).

#### Example

Keep in mind we set revalidate to false to avoid it performing a HTTP request for this example, since this would just
over-write the static data with the server data again.

```svelte
<script>
  import { useSWR } from 'sswr'

  const { data: post, mutate } = useSWR('https://jsonplaceholder.typicode.com/posts/1')
</script>

{#if $post}
  <div>{$post.title}</div>
  <button on:click={() => mutate((state) => ({ ...state, title: 'Sample' }), { revalidate: false })}>
    Mutate only title
  </button>
  <button on:click={() => mutate({ title: 'Sample' }, { revalidate: false })}>
    Leave only title
  </button>
{/if}
```

## Error handling

You can handle request errors by using the `error` return value on a hook call. This will return the specific error that happened to the hook.
For example, a failed request.

### Example

```svelte
<script>
  import { useSWR } from 'sswr'

  const { data: posts, error } = useSWR('https://jsonplaceholder.typicode.com/posts')
</script>

{#if $error}
  <div>There was an error</div>
{:else if $posts}
 {#each $posts as post (post.id)}
    <h1>{post.title}</h1>
 {/each}
{/if}
```

## Clear Cache

### Global clear function with given keys

You can clear all the cached keys or the specified ones when you need to invalidate some keys.

To do this, you can use the `clear` global function.

```js
import { clear } from 'sswr'
```

#### Signature

```ts
function clear(keys, options): void
```

##### Parameters

- `keys`: A single key or a list with the keys to delete. If keys is undefined, all keys will be cleared from the cache.
- `options`: A partial object containing one of the following options:
  - `broadcast: boolean`: Determines if the cache should broadcast the cache change to subscribed handlers. That means telling them the value now resolves to undefined.

### On specific hooks with keys

You can clear specific keys by grabing the `clear` function of the `useSWR` call.
This function will allow you to clear the data on demand. There's no need
to provide the key for this function since it's already bound to the hook key. It only accepts the options.

#### Signature

```ts
function clear(options): void
```

##### Parameters

- `options`: Same as global clear (check above).

#### Example

```svelte
<script>
  import { useSWR } from 'sswr'

  const { data: post, clear } = useSWR('https://jsonplaceholder.typicode.com/posts/1')
</script>

{#if $post}
  <div>{$post.title}</div>
  <button on:click={() => clear()}>
    Clear cacheed data
  </button>
{/if}
```

## Using with SvelteKit SSR

SvelteKit allows you to fetch data on the backend. This allows you to combine SSR (where your data is present in the HTML) with the live updating that this package provides.

Here is an example of how to implement the [Getting Started](#getting-started) example with support for SSR. In this example, we have disabled the
revalidation on the client, althought it is also possible to re-hydrate the
information on it if needed.

```svelte
<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit';

  const url = 'https://jsonplaceholder.typicode.com/posts';

  export const load: Load = async ({ fetch }) => {
    const response = await fetch(url);

    return {
      props: {
        initialData: await response.json()
      }
    };
  };
</script>

<script lang="ts">
  import { useSWR } from 'sswr';

  interface Post {
    id: number;
    title: string;
    body: string;
  }

  export let initialData: Post[];

  const { data: posts } = useSWR<Post[]>(url, {
    initialData,
    revalidateOnStart: false
  });
</script>

{#if $posts}
  {#each $posts as post (post.id)}
    <h1>{post.title}</h1>
    <p>{post.body}</p>
  {/each}
{/if}
```

## Contributors

- [Sam McCord](https://github.com/sammccord)
- [Len Boyette](https://github.com/kevlened)
- [Stanislav Khromov](https://github.com/khromov)
