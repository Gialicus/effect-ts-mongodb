import { Chunk, Effect, Request, RequestResolver } from "effect";
import { DbConnectionError, DbProvider } from "../../../connection";
import { ObjectIdParseError } from "./getOne";
import { Document, ObjectId } from "bson";
import { find } from "../find";
import { ModelProvider } from "../../model";
import { WithId } from "mongodb";

export interface GetMany
  extends Request.Request<
    ObjectIdParseError | DbConnectionError,
    Chunk.Chunk<WithId<Document>>
  > {
  _tag: "GetMany";
  ids: string[];
}

export const GetMany = Request.tagged<GetMany>("GetMany");

export const GetManyResolver = RequestResolver.fromFunctionEffect(
  (req: GetMany) =>
    find({
      _id: {
        $in: req.ids.filter(ObjectId.isValid).map((v) => new ObjectId(v)),
      },
    }).pipe(
      Effect.tap(() =>
        Effect.log(`Execute find for ids: ${req.ids.join(", ")}`)
      )
    )
).pipe(RequestResolver.contextFromServices(ModelProvider, DbProvider));

export const getMany = (ids: string[]) =>
  Effect.request(GetMany({ ids }), GetManyResolver).pipe(
    Effect.tap((o) => Effect.log(o)),
    Effect.withRequestCaching(true)
  );
