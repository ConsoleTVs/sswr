import { describe, it, assert } from 'vitest'
import { get } from "svelte/store";

import { useSWR } from "./sswr";

const wait = (ms: number) => new Promise(res => setTimeout(res, ms))

const fetcher = async (key: string) => {
  await wait(100);
  return { key }
}

describe("useSWR", () => {
  it("should be undefined initially if no `initialData` is provided.", async () => {
    const { data } = useSWR("/", { fetcher });
    assert.isUndefined(get(data));
  });

  it("should set the data.", async () => {
    const { data } = useSWR("/testing", { fetcher });
    await wait(200);
    assert.equal(get(data)?.key , "/testing");
  });

  it("should populate data if `initialData` is provided.", async () => {
    // try removing the initial data and test will fail
    const { data } = useSWR("/with-initial-data", {
      initialData: { key: "/with-initial-data" },
      fetcher
    });
    assert.equal(get(data)?.key , "/with-initial-data");
  });
});