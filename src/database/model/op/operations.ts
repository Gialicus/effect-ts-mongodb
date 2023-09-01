import { Effect } from "effect/Effect";
import { Option } from "effect/Option";
import { DbProvider, DbConnectionError } from "../../connection";
import { ModelProvider } from "../model";
import { MongoFindStreamError } from "./find";
import { Chunk } from "effect/Chunk";
import {
  DeleteResult,
  InsertOneResult,
  UpdateResult,
  WithId,
  Document,
} from "mongodb";
import { MongoDeleteError } from "./deleteOne";
import { MongoInsertError } from "./insertOne";

type FindOne = Effect<
  DbProvider | ModelProvider,
  DbConnectionError,
  Option<Document>
>;

type Find = Effect<
  DbProvider | ModelProvider,
  MongoFindStreamError,
  Chunk<WithId<Document>>
>;

type DeleteOne = Effect<
  DbProvider | ModelProvider,
  MongoDeleteError,
  DeleteResult
>;
type InsertOne = Effect<
  DbProvider | ModelProvider,
  MongoInsertError,
  InsertOneResult<Document>
>;
type UpdateOne = Effect<
  DbProvider | ModelProvider,
  MongoDeleteError,
  UpdateResult<Document>
>;

export type DbOperation = Find | FindOne | UpdateOne | InsertOne | DeleteOne;
