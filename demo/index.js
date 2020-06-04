import { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Bucket from "../index.js";

dotenv.config();

const bucket = Bucket("bucket-demo");

const __dirname = dirname(fileURLToPath(import.meta.url));

(async () => {
  try {
    let init = new Date();
    const info = await bucket.info();
    console.log("Info:", info, new Date() - init, "ms");

    init = new Date();
    const list = await bucket.list();
    console.log("Files:", list, new Date() - init, "ms");

    init = new Date();
    const there = await bucket.exists("Ul25dvOx00.png");
    const notthere = await bucket.exists("abc.png");
    console.log("Exists:", there, notthere, new Date() - init, "ms");

    init = new Date();
    const file = await bucket.upload(__dirname + "/example.png");
    console.log("Up:", file, new Date() - init, "ms");

    init = new Date();
    const local = await bucket.download(file, __dirname + "/example2.png");
    console.log("Down:", local, new Date() - init, "ms");

    init = new Date();
    const del = await bucket.remove(file);
    console.log("Deleted:", del, new Date() - init, "ms");
  } catch (error) {
    console.error(error);
  }
})();
