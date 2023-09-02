import { Context } from "effect";
import { Lookup } from "./lookup.interface";

export interface LookupProvider {
  db: string;
  collection: string;
  lookups: Lookup[];
}

export const LookupProvider = Context.Tag<LookupProvider>();
