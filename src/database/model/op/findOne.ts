import { Document, Filter } from "mongodb";
import { GetModel } from "../model";
import { Effect } from "effect";
import { CloseConnection, DbConnectionError } from "../../connection";
import { getErrorMessage } from "../../../utils";

export class NotFoundError extends Error {
  _tag = "NotFoundError";
  constructor(err: unknown) {
    super(getErrorMessage(err));
  }
}

export const findOne = (filter: Filter<Document>) =>
  GetModel.pipe(
    Effect.flatMap((col) =>
      Effect.tryPromise({
        try: () => col.findOne(filter),
        catch: (e) => new DbConnectionError(e),
      })
    ),
    Effect.flatMap((value) =>
      value ? Effect.succeedSome(value) : Effect.succeedNone
    ),
    Effect.tap(() => CloseConnection)
  );
