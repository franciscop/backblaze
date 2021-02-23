## 2.1.0

- [new feature] Added filter prefix to .list(filter).
- Increased file count for `.list()`.
- Added workflow testing.
- [bug] Allow to limit the key to only current bucket, and it still works.
- [bug] Removed unused Jest

### 2.0.2

Improved documentation on npm.

### 2.0.1

Fixed bug where in some situations `.remove()` would return the filename as a string instead of the full File description.

## 2.0.0

Creted the shared `File` description:

- [breaking] `.list()`, `.upload()` and `.remove()` now return the new File description.
- `.upload()`, `.download()`, `.exists()` and `remove()` now accept either a plain file name or a File description.

Added repository info and improved docs.

## 1.x.x

Created the library. It is built on top of `backblaze-b2` but greatly simplifies how to handle everything.
