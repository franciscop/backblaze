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

> Please note that relative file paths are relative to the **working directory** [as specified on Node.js' fs](https://nodejs.org/api/fs.html#fs_file_paths). You can always provide absolute paths.

All of the methods are async and are related to a single bucket. You can work with multiple buckets as well by creating them as expected:

```js
const bucket1 = Bucket('bucket-name-1', { ... });
const bucket2 = Bucket('bucket-name-2', { ... });
```



## API

The main function is synchronous, but all of the methods are async so they should be used with `await`:

- `Bucket(name, { id, key })`
- `bucket.info()` // {id, name, etc}
- `bucket.list()`
- `bucket.count()`
- `bucket.exists(remote)`
- `bucket.upload(local, remote)`
- `bucket.download(remote, local)`
- `bucket.remove(remote)`
- Others? Propose them on Github.



### Bucket()

```js
import Bucket from 'backblaze';

const bucket = Backblaze('bucket-name', { id, key });

const file = await bucket.upload('./avatar.png');
console.log(file);
// 'kwergvckwsdb.png'

console.log(await bucket.list());
// ['avatar.png', 'profile.png', ...]
```

Create an instance associated to a bucket. It receives first the bucket name, and then an object with the config:

```js
const bucket = Bucket("bucket-demo", {
  id: process.env.B2_ID,
  key: process.env.B2_KEY
});
```

No need for `new` or `await`. Internally it will start loading the bucket as soon as initialized like this, and if it hasn't loaded by the time it's used then it will await on the first operation for it.

The `id` and `key`, and the second parameter altogether, can be skipped if the environment variables `B2_ID` and `B2_KEY` have been set respectively:

```js
const bucket = Bucket("bucket-demo");
```



### .info()

Load some information related to the bucket itself:

```js
const info = await bucket.info();
console.log(info);
// {
//   accountId: '...',
//   bucketId: '...',
//   bucketInfo: {},
//   bucketName: '...',
//   bucketType: '...',
//   corsRules: [],
//   lifecycleRules: [],
//   options: [ 's3' ],
//   revision: 2
// }
```



### .list()

Show a list with the filenames of the files in your bucket. It displays all of the filenames in the bucket including any subfolders:

```js
const list = await bucket.list();
console.log(list);
// [ 'avatar.png', 'users/abc.png', ... ]
```



### .count()

Display the number of items inside a bucket, including sub-folder files:

```js
await bucket.count();
// 27
```



### .upload()

Upload a local file to the bucket:

```js
bucket.upload(localFilePath, [remoteFileName]) => remoteFileName
```

The arguments are:

- `localFilePath` (required): the path to the file to be uploaded. It will be relative to the **working directory** [as specified on Node.js' fs](https://nodejs.org/api/fs.html#fs_file_paths). TODO: accept a byte sequence.
- `remoteFileName` (optional): the name of the file in the bucket. Leave it empty to autogenerate the name. We are purposefully avoiding reusing the `localFilePath` name to avoid collisions and other issues.

```js
// Just upload a file and get the path in the response:
const file = await bucket.upload('./avatar.png');
console.log(file);  // Ul25dvOx00.png

// Upload a file inside a folder and specify the remote name:
await bucket.upload('./public/favicon.png', 'favicon.png');

// Upload a file to a folder in the bucket:
await bucket.upload('./avatar.png', 'public/favicon.png');

// Absolute paths:
await bucket.upload(__dirname + '/avatar.png', 'favicon.png')
```

If you are using a modern Node.js version that doesn't define `__dirname`, you can create `__dirname` like this:

```jsx
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
```



### .download()

Downloads a file from the bucket into the server:

```js
bucket.download(remoteFileName, [localFilePath]) => localFilePath
```

The arguments are:

- `remoteFileName` (required): the name of the file in the bucket. It can be inside a folder as well.
- `localFilePath` (optional): the path where the file will be located. It will be relative to the **working directory** [as specified on Node.js' fs](https://nodejs.org/api/fs.html#fs_file_paths). Leave it empty to use the current working directory and the remote file name.


```js
// Upload the file with the same name as locally:
const path = await bucket.download('avatar.png');
console.log(path);  //  /users/me/projects/backblaze/avatar.png

// Upload a file inside a folder to the root:
await bucket.download('favicon.png', './public/favicon.png');

// Upload a file to a folder in the bucket:
await bucket.download('public/favicon.png', './avatar.png');

// Absolute paths:
await bucket.download('favicon.png', __dirname + '/avatar.png')
```

If you are using a modern Node.js version that doesn't define `__dirname`, you can create `__dirname` like this:

```jsx
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
```





### .exists()

Check whether a file exists on the bucket:

```js
if (await bucket.exists('avatar.png')) {
  console.log('Avatar already exists');
}

// Check inside a subfolder
if (await bucket.exists('users/abc.png')) {
  console.log('User already has a profile picture');
}
```
