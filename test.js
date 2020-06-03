import { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Bucket from "./index.js";

import toBeType from "jest-tobetype";

dotenv.config();

expect.extend(toBeType);

const bucket = Bucket("bucket-demo", {
  id: process.env.B2_ID,
  key: process.env.B2_KEY
});

describe("backblaze", () => {
  it("can list the files", async () => {
    const list = await bucket.list();
    expect(Array.isArray(list)).toBe(true);
  });
});
