# Backblaze

An *unofficial* package to easily deal with Backblaze API on Node.js:

```js
import Bucket from 'backblaze';

const bucket = Bucket('bucket-name', {
  id: process.env.B2_ID,   // Use an id-key that are not master for security
  key: process.env.B2_KEY
});

console.log(await bucket.list());
// ['favicon.png', 'hello.png', ...]

// Upload a file from a local file to an auto-generated name
const remote = await bucket.upload('./avatar.png');

// Let's download it now as a copy locally
await bucket.download(remote, './avatar-copy.png');
```

> Please note that all the relative files are relative to the **working directory** [as specified on Node.js' fs](https://nodejs.org/api/fs.html#fs_file_paths). You can provide absolute paths for better certainty.

All of the methods are async and are related to a single bucket. You can work with multiple buckets as well by creating them as expected:

```js
const bucket1 = Bucket('bucket-name-1', {
  id: process.env.B2_ID,
  key: process.env.B2_KEY
});

const bucket2 = Bucket('bucket-name-2', {
  id: process.env.B2_ID,
  key: process.env.B2_KEY
});
```



## API

- `Bucket(name, { id, key })`
- `bucket.name`
- `bucket.meta()` // {id, name, etc}
- `bucket.list()`
- `bucket.count()`
- `bucket.exists(remote)`
- `bucket.upload(local, remote)`
- `bucket.download(remote, local)`
- `bucket.remove(remote)`
- Others? Propose them on Github.

### Bucket()

Create an instance associated to a bucket.

### .list()

Show a list with the filenames of the files in your bucket. It displays all of the filenames in the bucket:

```js

```

### .upload()

Upload a local file to the bucket:

```js
bucket.upload(localFile, remoteFileName) => remoteFileName
```

The arguments can be:

- `localFile` (required): the path to the file to be uploaded. It's preferred for it to be absolute, but relative (to the **running** dir) are also accepted. TODO: accept a byte sequence.
- `remoteFileName` (optional): the name of the file in the bucket. Leave it empty to autogenerate the name. We are purposefully avoiding reusing the `localFile` name to avoid collisions and issues.

#### Examples

```js
// Upload the file with the same name as locally:
bucket.upload('./avatar.png', 'avatar.png');

// Upload a file inside a folder to the root:
bucket.upload('./public/favicon.png', 'favicon.png');

// Upload a file to a folder in the bucket:
bucket.upload('./avatar.png', 'public/favicon.png');
```

See [the Node.js docs](https://nodejs.org/api/esm.html#esm_no_require_exports_module_exports_filename_dirname) for making the path absolute.




### .exists()

> TODO

### .count()

> TODO
