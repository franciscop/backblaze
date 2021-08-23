import { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";
import Bucket from "../index.js";

dotenv.config();

const bucket = Bucket("bucket-demo");

const __dirname = dirname(fileURLToPath(import.meta.url));

beforeAll(async () => {
  let init = new Date();
  await bucket.info();
  console.log("Info:", new Date() - init, "ms");
  init = new Date();
  await Promise.all([
    bucket.upload(__dirname + "/example.png", "AmZmqtAgTA.png"),
    bucket.upload(__dirname + "/example.png", "demo/pnckl8xnaG.png"),
    bucket.upload(__dirname + "/data.json", "data.json"),
    bucket.upload(__dirname + "/data.json", "demo/data.json")
  ]);
  console.log("Upload:", new Date() - init, "ms");
}, 30000);

describe(".info()", () => {
  it("can be initialized", async () => {
    expect(typeof Bucket).toBe("function");
    expect(typeof bucket).toBe("object");
  });

  it("Can return basic information", async () => {
    const info = await bucket.info();
    expect(info).toHaveProperty("bucketId");
    expect(info).toHaveProperty("bucketName");
    expect(info).toHaveProperty("accountId");
    expect(info).toHaveProperty("baseURL");
  });
});

describe(".list()", () => {
  it("can list all of the files", async () => {
    const list = await bucket.list();
    const names = list.map(file => file.name);
    expect(names).toContain("AmZmqtAgTA.png");
    expect(names).toContain("demo/pnckl8xnaG.png");
  });

  it("can filter by file name", async () => {
    const list = await bucket.list("AmZm");
    expect(list[0].name).toEqual("AmZmqtAgTA.png");
  });

  it("can namespace by folder", async () => {
    const list = await bucket.list("demo/");
    const names = list.map(file => file.name);
    expect(names).toContain("demo/pnckl8xnaG.png");
    expect(names).not.toContain("AmZmqtAgTA.png");
  });

  it("can namespace by folder", async () => {
    const list = await bucket.list("/demo/");
    const names = list.map(file => file.name);
    expect(names).toContain("demo/pnckl8xnaG.png");
    expect(names).not.toContain("AmZmqtAgTA.png");
  });
});

describe(".exists()", () => {
  it("can make sure a filename exists", async () => {
    const there = await bucket.exists("AmZmqtAgTA.png");
    const notthere = await bucket.exists("abc.png");

    expect(there).toBe(true);
    expect(notthere).toBe(false);
  });
});

describe(".upload()", () => {
  it("can upload a file", async () => {
    const file = await bucket.upload(__dirname + "/example.png");
    expect(file).toHaveProperty("name");
    expect(file).toHaveProperty("type", "image/png");
    await bucket.remove(file);
  }, 20000);

  it("can upload a file with namespace", async () => {
    const file = await bucket.upload(__dirname + "/example.png", "/demo/");
    expect(file.name).toMatch(/^demo\/[a-zA-Z0-9]+\.png$/);
    await bucket.remove(file);
  }, 20000);
});

describe(".download()", () => {
  it("can download a file", async () => {
    const file = await bucket.download("AmZmqtAgTA.png");
    expect(file.split("/").pop()).toBe("AmZmqtAgTA.png");
    await new Promise((done, fail) =>
      fs.unlink(file, error => (error ? fail(error) : done()))
    );
  }, 10000);
});

describe(".read()", () => {
  it("can read a file", async () => {
    const file = await bucket.read("data.json");
    expect(file.length).toBe(23);
    expect(file).toEqual(`{\n  "hello": "world"\n}\n`);
  }, 10000);

  it("can read and decode a file", async () => {
    const file = await bucket.read("data.json").then(JSON.parse);
    expect(file).toEqual({ hello: "world" });
  }, 10000);
});

describe(".remove()", () => {
  it("can delete a file", async () => {
    const filesBefore = await bucket.list();
    expect(filesBefore.map(file => file.name)).toContain("AmZmqtAgTA.png");

    // Returns the right parameters
    const file = await bucket.remove("AmZmqtAgTA.png");
    expect(file).toHaveProperty("name", "AmZmqtAgTA.png");
    expect(file).toHaveProperty("type", "image/png");

    const filesAfter = await bucket.list();
    expect(filesAfter.map(file => file.name)).not.toContain("AmZmqtAgTA.png");
  }, 30000);
});

// (async () => {
//   try {
//     const local = await bucket.download(file, __dirname + "/example2.png");
//     console.log("Download:", local);
//
//     const del = await bucket.remove(file);
//     console.log("Deleted:", del);
//   } catch (error) {
//     console.error(error);
//   }
// })();
