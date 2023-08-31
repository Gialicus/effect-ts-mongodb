import { Document, ObjectId } from "mongodb";
import { Effect, Option, Request, RequestResolver } from "effect";
import { findOne } from "../findOne";
import { ModelProvider } from "../../model";
import { DbConnectionError, DbProvider } from "../../../connection";

export class ObjectIdParseError extends Error {
  _tag = "ObjectIdParseError";
}

export interface GetOne
  extends Request.Request<
    ObjectIdParseError | DbConnectionError,
    Option.Option<Document>
  > {
  readonly _tag: "GetOne";
  readonly id: string;
}

export const GetOne = Request.tagged<GetOne>("GetOne");

export const GetOneResolver = RequestResolver.fromFunctionEffect(
  (req: GetOne) =>
    ObjectId.isValid(req.id)
      ? findOne({ _id: new ObjectId(req.id) }).pipe(
          Effect.tap(() => Effect.log(`Execute find for id: ${req.id}`))
        )
      : Effect.fail(
          new ObjectIdParseError("Parse ObjectID fail for value: " + req.id)
        )
).pipe(RequestResolver.contextFromServices(ModelProvider, DbProvider));

export const getOne = (id: string) =>
  Effect.request(GetOne({ id }), GetOneResolver).pipe(
    Effect.tap((o) => Effect.log(o)),
    Effect.withRequestCaching(true)
  );
