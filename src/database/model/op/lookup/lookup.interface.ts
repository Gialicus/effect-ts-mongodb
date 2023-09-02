import { Filter, Document } from "mongodb";

export interface Lookup {
  from: string;
  localField: string;
  foreignField: string;
  as: string;
  match?: Filter<Document>;
}
