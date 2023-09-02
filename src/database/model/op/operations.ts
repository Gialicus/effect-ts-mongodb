import { Effect } from "effect/Effect";
import { Option } from "effect/Option";
import { DbProvider, DbConnectionError } from "../../connection";
import { ModelProvider } from "../model";
import { Chunk } from "effect/Chunk";
import {
  DeleteResult,
  InsertOneResult,
  UpdateResult,
  WithId,
  Document,
} from "mongodb";
import { MongoFindStreamError } from "./find/find.error";
import { MongoDeleteError } from "./deleteOne/deleteOne.error";
import { MongoInsertError } from "./insertOne/insertOne.error";

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
