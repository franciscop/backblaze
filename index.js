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

export default function (name, { id = env.B2_ID, key = env.B2_KEY } = {}) {
  const b2 = new B2({ applicationKeyId: id, applicationKey: key });
  let bucket = {};

  const bucketProm = new Promise(async (done, fail) => {
    try {
      const auth = await b2.authorize(); // must authorize first
      const baseURL = auth.data.downloadUrl + "/file/" + name + "/";
      const list = await b2.listBuckets();
      const raw = list.data.buckets.find((b) => b.bucketName === name);
      bucket = { ...raw, baseURL };
      done(bucket);
    } catch (error) {
      console.error("AUTH", error.request.res);
      fail(error);
    }
  });

  const info = () => bucketProm;

  const list = async () => {
    const { bucketId, baseURL } = await info();
    const res = await b2.listFileNames({ bucketId });
    return res.data.files.map((file) => ({
      name: file.fileName,
      type: file.contentType,
      size: file.contentLength,
      url: baseURL + file.fileName,
      timestamp: new Date(file.uploadTimestamp),
    }));
  };

  const count = async () => {
    const { bucketId } = await info();
    const res = await b2.listFileNames({ bucketId });
    return res.data.files.length;
  };

  const exists = async (file) => {
    const files = await list();
    return files.includes(file);
  };

  const download = async (remote, local) => {
    // Allow to pass an object with the full file description
    remote = remote.name || remote;
    local = local || nanoid() + "." + remote.split(".").pop();
    const { bucketId } = await info();
    const down = await b2.downloadFileByName({
      bucketName: name,
      fileName: remote,
      responseType: "arraybuffer",
    });
    await writeFile(local, down.data);
    return path.resolve(process.cwd(), local);
  };

  const upload = async (local, remote) => {
    remote = remote
      ? remote.name || remote
      : nanoid() + "." + local.split(".").pop();
    const { bucketId } = await info();
    const [res, data] = await Promise.all([
      b2.getUploadUrl({ bucketId }),
      readFile(local),
    ]);
    const { authorizationToken, uploadUrl } = res.data;
    const uploaded = await b2.uploadFile({
      fileName: remote,
      uploadUrl,
      uploadAuthToken: authorizationToken,
      data,
    });
    return {
      name: uploaded.data.fileName,
      type: uploaded.data.contentType,
      size: uploaded.data.contentLength,
      url: bucket.baseURL + uploaded.data.fileName,
      timestamp: new Date(uploaded.data.uploadTimestamp),
    };
  };

  const remove = async (file) => {
    // Allow to pass an object with the full file description
    file = file.name || file;
    const { bucketId } = await info();
    const res = await b2.listFileNames({ bucketId });
    const fullFile = res.data.files.find((f) => f.fileName === file);
    await b2.deleteFileVersion({
      fileId: fullFile.fileId,
      fileName: fullFile.fileName,
    });
    return file;
  };

  return { info, list, count, exists, upload, download, remove };
}
