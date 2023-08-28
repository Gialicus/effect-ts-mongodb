import { Context, Effect } from "effect";
import EventEmitter from "events";
import {
  PathOrFileDescriptor,
  WriteFileOptions,
  readFile,
  writeFile,
} from "fs";

interface WriteFS {
  readonly write: (
    path: PathOrFileDescriptor,
    data: string | NodeJS.ArrayBufferView,
    opt: WriteFileOptions
  ) => Effect.Effect<never, NodeJS.ErrnoException, void>;
}

export const WriteFS = Context.Tag<WriteFS>();

class WriteFileImpl implements WriteFS {
  write(
    path: PathOrFileDescriptor,
    data: string | NodeJS.ArrayBufferView,
    opt: WriteFileOptions
  ) {
    return Effect.async<never, NodeJS.ErrnoException, void>((resume) => {
      writeFile(path, data, opt, (err: NodeJS.ErrnoException | null) => {
        if (err) resume(Effect.fail(err));
        resume(Effect.unit);
      });
    });
  }
}

export function WriteFsLive(
  path: PathOrFileDescriptor,
  data: string | NodeJS.ArrayBufferView,
  opt: WriteFileOptions
) {
  return WriteFS.pipe(
    Effect.flatMap((w) => w.write(path, data, opt)),
    Effect.provideService(WriteFS, WriteFS.of(new WriteFileImpl()))
  );
}

type ReadOpt =
  | ({
      encoding?: null | undefined;
      flag?: string | undefined;
    } & EventEmitter.Abortable)
  | null;

interface ReadFS {
  readonly read: (
    path: PathOrFileDescriptor,
    opt: ReadOpt
  ) => Effect.Effect<never, NodeJS.ErrnoException, Buffer>;
}

export const ReadFS = Context.Tag<ReadFS>();

class ReadFSImpl implements ReadFS {
  read(path: PathOrFileDescriptor, opt: ReadOpt) {
    return Effect.async<never, NodeJS.ErrnoException, Buffer>((resume) => {
      readFile(path, opt, (err: NodeJS.ErrnoException | null, data: Buffer) => {
        if (err) resume(Effect.fail(err));
        resume(Effect.succeed(data));
      });
    });
  }
}

export const ReadFSLive = (path: PathOrFileDescriptor, opt: ReadOpt) =>
  ReadFS.pipe(
    Effect.flatMap((r) => r.read(path, opt)),
    Effect.provideService(ReadFS, ReadFS.of(new ReadFSImpl()))
  );
