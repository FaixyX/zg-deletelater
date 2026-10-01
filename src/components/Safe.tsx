"use client";

import { catchError, type ErrorInfo } from "next/error";
import { useEffect } from "react";

import { rescue } from "@/lib/rescue";

/**
 * Boundaries for the parts of the page that move it rather than make it.
 *
 * Nearly everything animated here is a component that renders nothing and
 * does its work in an effect, looking up the markup by id or class. One
 * of those throwing -- a selector that matched nothing, a browser missing
 * an API, a script chunk that came in broken -- used to take the whole app
 * down with it, and with it the page. Wrapped, it takes down only itself:
 * that one animation does not run, the console says which, and the rest
 * of the site carries on.
 *
 *   <Safe>      for decoration: if it stops, the page is simply a little
 *               stiller (the cursor, the header's auto-hide, a shader).
 *   <SafeGate>  for motion that also reveals things: the hero's intro, the
 *               preloaders, the entrances. If one of these stops it may
 *               have left content hidden, so it also runs rescue() to
 *               put everything back (see lib/rescue.ts).
 */

type Props = { name?: string };

function Stopped({ name, error, gate }: { name?: string; error: unknown; gate: boolean }) {
  useEffect(() => {
    console.error(`[zg] ${name ?? "a component"} stopped, the page carries on:`, error);
    if (gate) rescue();
  }, [name, error, gate]);
  return null;
}

export const Safe = catchError(function Quiet(props: Props, { error }: ErrorInfo) {
  return <Stopped name={props.name} error={error} gate={false} />;
});

export const SafeGate = catchError(function Gate(props: Props, { error }: ErrorInfo) {
  return <Stopped name={props.name} error={error} gate />;
});
