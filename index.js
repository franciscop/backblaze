import fs from "fs";
import { promisify } from "util";
import path from "path";
import B2 from "backblaze-b2";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  10
);

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const env = process.env;

export default function(name, { id = env.B2_ID, key = env.B2_KEY } = {}) {
  const b2 = new B2({ applicationKeyId: id, applicationKey: key });
  let bucket = {};

  const bucketProm = new Promise(async (done, fail) => {
    try {
      const auth = await b2.authorize(); // must authorize first
      const baseURL = auth.data.downloadUrl + "/file/" + name + "/";

      const res = await b2.getBucket({ bucketName: name });
      const raw = res.data.buckets[0];
      // const list = await b2.listBuckets();
      // const raw = list.data.buckets.find(b => b.bucketName === name);

      bucket = { ...raw, baseURL };
      done(bucket);
    } catch (error) {
      console.error("AUTH", error.request ? error.request.res : error);
      fail(error);
    }
  });

  const info = () => bucketProm;

  const list = async prefix => {
    // Ignore leading slash like "/" or "/data"
    if (prefix) prefix = prefix.replace(/^\//, "");

    const { bucketId, baseURL } = await info();

    // Transform from the B2 format to the normalized File definition
    const toFile = file => ({
      name: file.fileName,
      type: file.contentType,
      size: file.contentLength,
      url: baseURL + file.fileName,
      timestamp: new Date(file.uploadTimestamp)
    });
    const files = [];
    let next = null;
    do {
      const res = await b2.listFileNames({
        bucketId,
        prefix,
        startFileName: next,
        maxFileCount: 10000
      });
      files.push(...res.data.files.map(toFile));
      next = res.data.nextFileName;
    } while (next);
    return files;
  };

  const count = async prefix => {
    // Ignore leading slash like "/" or "/data"
    if (prefix) prefix = prefix.replace(/^\//, "");

    const { bucketId } = await info();
    const res = await b2.listFileNames({
      bucketId,
      prefix,
      maxFileCount: 10000
    });
    return res.data.files.length;
  };

  const file = async remote => {
    remote = remote.name || remote;
    remote = remote.replace(/^\//, "");
    const files = await list();
    return files.find(file => file.name === remote);
  };

  const exists = async remote => {
    remote = remote.name || remote;
    remote = remote.replace(/^\//, "");
    const files = await list();
    return Boolean(files.find(file => file.name === remote));
  };

  const read = async remote => {
    // Allow to pass an object with the full file description
    remote = remote.name || remote;
    remote = remote.replace(/^\//, "");

    // Ignore any leading slash
    remote = remote.replace(/^\//, "");
    const { bucketId } = await info();
    const down = await b2.downloadFileByName({
      bucketName: name,
      fileName: remote,
      responseType: "arraybuffer"
    });
    return down.data.toString();
  };

  const download = async (remote, local) => {
    // Allow to pass an object with the full file description
    remote = remote.name || remote;
    remote = remote.replace(/^\//, "");

    // Ignore any leading slash
    remote = remote.replace(/^\//, "");
    local = local || "./" + remote;
    const { bucketId } = await info();
    const down = await b2.downloadFileByName({
      bucketName: name,
      fileName: remote,
      responseType: "arraybuffer"
    });
    await writeFile(local, down.data);
    return path.resolve(process.cwd(), local);
  };

  const upload = async (local, remote) => {
    const ext = local.split(".").pop();
    remote = remote ? remote.name || remote : nanoid() + "." + ext;
    if (remote.endsWith("/")) remote = remote + nanoid() + "." + ext;
    remote = remote.replace(/^\//, "");

    const { bucketId } = await info();
    const [res, data] = await Promise.all([
      b2.getUploadUrl({ bucketId }),
      readFile(local)
    ]);
    const { authorizationToken, uploadUrl } = res.data;
    const uploaded = await b2.uploadFile({
      fileName: remote,
      uploadUrl,
      uploadAuthToken: authorizationToken,
      data
    });
    return {
      name: uploaded.data.fileName,
      type: uploaded.data.contentType,
      size: uploaded.data.contentLength,
      url: bucket.baseURL + uploaded.data.fileName,
      timestamp: new Date(uploaded.data.uploadTimestamp)
    };
  };

  const remove = async remote => {
    // Allow to pass an object with the full remote description
    remote = remote.name || remote;
    const { bucketId } = await info();

    const remoteFile = file(remote);

    while (await exists(remote)) {
      const res = await b2.listFileNames({ bucketId });
      const toDelete = res.data.files.find(f => f.fileName === remote);

      await b2.deleteFileVersion({
        fileId: toDelete.fileId,
        fileName: toDelete.fileName
      });
    }
    return remoteFile;
  };

  return { info, list, count, exists, upload, read, download, remove };
}
