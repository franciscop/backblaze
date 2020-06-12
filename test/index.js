import { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Bucket from "../index.js";

dotenv.config();

const bucket = Bucket("bucket-demo");

const __dirname = dirname(fileURLToPath(import.meta.url));

(async () => {
  try {
    const info = await bucket.info();
    console.log("Info:", info);

    const list = await bucket.list();
    console.log("Files:", list);

    const there = await bucket.exists("Ul25dvOx00.png");
    const notthere = await bucket.exists("abc.png");
    console.log("Exists:", there, notthere);

    const file = await bucket.upload(__dirname + "/example.png");
    console.log("Upload:", file);

    const local = await bucket.download(file, __dirname + "/example2.png");
    console.log("Download:", local);

    const del = await bucket.remove(file);
    console.log("Deleted:", del);
  } catch (error) {
    console.error(error);
  }
})();
