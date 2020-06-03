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

export default function(bucketName, { id, key }) {
  const b2 = new B2({ applicationKeyId: id, applicationKey: key });

  const bucketProm = new Promise(async (done, fail) => {
    try {
      await b2.authorize(); // must authorize first
      const list = await b2.listBuckets();
      const bucket = list.data.buckets.find(b => b.bucketName === bucketName);
      done(bucket.bucketId);
    } catch (error) {
      console.log("AUTH", error.request.res);
      fail(error);
    }
  });

  const getBucket = () => {
    return bucketProm;
  };

  const list = async () => {
    const bucketId = await getBucket();
    const res = await b2.listFileNames({ bucketId });
    return res.data.files.map(file => file.fileName);
  };

  const exists = async file => {
    const files = await list();
    return files.includes(file);
  };

  const download = async (remote, local) => {
    local = local || nanoid() + "." + remote.split(".").pop();
    const bucketId = await getBucket();
    const down = await b2.downloadFileByName({
      bucketName,
      fileName: remote,
      responseType: "arraybuffer"
    });
    await writeFile(local, down.data);
    return path.resolve(process.cwd(), local);
  };

  const upload = async (local, remote) => {
    remote = remote || nanoid() + "." + local.split(".").pop();
    const bucketId = await getBucket();
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
    return uploaded.data.fileName;
  };

  const remove = async file => {
    const bucketId = await getBucket();
    const res = await b2.listFileNames({ bucketId });
    const fullFile = res.data.files.find(f => f.fileName === file);
    await b2.deleteFileVersion({
      fileId: fullFile.fileId,
      fileName: fullFile.fileName
    });
    return file;
  };

  return { list, exists, download, upload, remove };
}
