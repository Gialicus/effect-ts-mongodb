import { Context, Effect, Stream } from "effect";
import { GetConnection } from "../../../connection";
import { getErrorMessage } from "../../../../utils";

export interface SyncItem {
  db: string;
  sync: {
    current: string;
    path: string;
    external: string;
  };
}

export const SyncItem = Context.Tag<SyncItem>();

export class MongoSyncError extends Error {
  _tag = "MongoSyncError";
}

const SyncCurrentCollection = Effect.gen(function* ($) {
  const [client, syncItem] = yield* $(Effect.all([GetConnection, SyncItem]));
  const current = client.db(syncItem.db).collection(syncItem.sync.current);
  const external = client.db(syncItem.db).collection(syncItem.sync.external);
  yield* $(
    Stream.fromAsyncIterable(
      current.watch(),
      (e) => new MongoSyncError(getErrorMessage(e))
    ),
    Stream.flatMap((change) =>
      Effect.gen(function* () {
        if (change.operationType === "insert") {
          const externalId = change.fullDocument[syncItem.sync.path];
          yield* $(
            Effect.log(
              `${syncItem.sync.current} was created set item in sync with id: ${externalId}`
            )
          );
          const externalItem = yield* $(
            Effect.tryPromise(() => external.findOne({ _id: externalId }))
          );
          yield* $(
            Effect.tryPromise(() =>
              current.updateOne(
                { _id: change.documentKey._id },
                {
                  $set: { ["sync." + syncItem.sync.path]: externalItem },
                }
              )
            )
          );
          return yield* $(Effect.unit);
        } else if (change.operationType === "update") {
          if (
            change.updateDescription.updatedFields &&
            Object.keys(change.updateDescription.updatedFields).includes(
              syncItem.sync.path
            )
          ) {
            const externalId =
              change.updateDescription.updatedFields[syncItem.sync.path];
            yield* $(
              Effect.log(
                `${syncItem.sync.current} item in sync was changed set new with id: ${externalId}`
              )
            );
            const externalItem = yield* $(
              Effect.tryPromise(() => external.findOne({ _id: externalId }))
            );
            yield* $(
              Effect.tryPromise(() =>
                current.updateOne(
                  { _id: change.documentKey._id },
                  {
                    $set: { ["sync." + syncItem.sync.path]: externalItem },
                  }
                )
              )
            );
            return yield* $(Effect.unit);
          }
        } else {
          return yield* $(Effect.unit);
        }
      }).pipe(Stream.fromEffect)
    ),
    Stream.runDrain
  );
});
const SyncExternalCollection = Effect.gen(function* ($) {
  const [client, syncItem] = yield* $(Effect.all([GetConnection, SyncItem]));
  const current = client.db(syncItem.db).collection(syncItem.sync.current);
  const external = client.db(syncItem.db).collection(syncItem.sync.external);
  yield* $(
    Stream.fromAsyncIterable(
      external.watch([], { fullDocument: "updateLookup" }), //user
      (e) => new MongoSyncError(getErrorMessage(e))
    ),
    Stream.flatMap((change) =>
      Effect.gen(function* () {
        const key = "sync." + syncItem.sync.path + "._id";
        if (change.operationType === "update") {
          yield* $(
            Effect.log(
              `${syncItem.sync.external} with id: ${change.documentKey._id} change update all references`
            )
          );
          yield* $(
            Effect.tryPromise(() =>
              current.updateMany(
                {
                  [key]: change.documentKey._id,
                },
                {
                  $set: {
                    ["sync." + syncItem.sync.path]: change.fullDocument,
                  },
                }
              )
            )
          );
          return yield* $(Effect.unit);
        } else {
          return yield* $(Effect.unit);
        }
      }).pipe(Stream.fromEffect)
    ),
    Stream.runDrain
  );
});

export const SyncCollection = Effect.all(
  [SyncCurrentCollection, SyncExternalCollection],
  { concurrency: "unbounded" }
).pipe(
  Effect.catchAll((e) => Effect.fail(new MongoSyncError(getErrorMessage(e))))
);
