import { Context, Effect, Stream } from "effect";
import { GetConnection } from "../../../connection";
import { getErrorMessage } from "../../../../utils";
import {
  MongoClient,
  Document,
  ChangeStreamInsertDocument,
  ChangeStreamUpdateDocument,
  ChangeStreamDeleteDocument,
} from "mongodb";

export interface SyncItem {
  db: string;
  sync: {
    from: string;
    to: Array<string>;
  };
  fields: string[];
}

export const SyncItem = Context.Tag<SyncItem>();

export class MongoSyncError extends Error {
  _tag = "MongoSyncError";
}

export const SyncCollection = Effect.all([GetConnection, SyncItem]).pipe(
  Effect.flatMap(([client, syncItem]) =>
    Stream.fromAsyncIterable(
      client.db(syncItem.db).collection(syncItem.sync.from).watch(),
      (e) => new MongoSyncError(getErrorMessage(e))
    ).pipe(
      Stream.flatMap((change) => {
        const effects = [];
        for (const name of syncItem.sync.to) {
          if (change.operationType === "insert") {
            const effect = handleInsert(client, syncItem, name, change);
            effects.push(effect);
          } else if (change.operationType === "update") {
            const effect = handleUpdate(client, syncItem, name, change);
            effects.push(effect);
          } else if (change.operationType === "delete") {
            const effect = handleDelete(client, syncItem, name, change);
            effects.push(effect);
          }
        }
        return Effect.all(effects).pipe(Stream.fromEffect);
      }),
      Stream.tap((result) => Effect.log(result)),
      Stream.runDrain
    )
  )
);
function handleUpdate(
  client: MongoClient,
  syncItem: SyncItem,
  name: string,
  change: ChangeStreamUpdateDocument<Document>
) {
  const replica = client.db(syncItem.db).collection(name);
  const effect = Effect.tryPromise({
    try: () =>
      replica.updateOne(
        {
          _id: change.documentKey._id,
        },
        {
          $set: change.updateDescription.updatedFields,
        }
      ),
    catch(error) {
      return new MongoSyncError(getErrorMessage(error));
    },
  });
  return effect;
}

function handleInsert(
  client: MongoClient,
  syncItem: SyncItem,
  name: string,
  change: ChangeStreamInsertDocument<Document>
) {
  const replica = client.db(syncItem.db).collection(name);
  const effect = Effect.tryPromise({
    try: () => replica.insertOne(change.fullDocument),
    catch(error) {
      return new MongoSyncError(getErrorMessage(error));
    },
  });
  return effect;
}

function handleDelete(
  client: MongoClient,
  syncItem: SyncItem,
  name: string,
  change: ChangeStreamDeleteDocument<Document>
) {
  const replica = client.db(syncItem.db).collection(name);
  const effect = Effect.tryPromise({
    try: () => replica.deleteOne(change.documentKey._id),
    catch(error) {
      return new MongoSyncError(getErrorMessage(error));
    },
  });
  return effect;
}
