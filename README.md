# Search Bible

Find verses and footnotes in the recovery verison

# Troubleshooting

## Fix node version mismatch:

If better-sqlite3 does not work it may need to be locally rebuilt by running

1. log node version on console in application
2. set electron version in package-lock.json to the one that matches node version (<https://releases.electronjs.org/releases/stable>)
3. run `rm -rf node_modules` and `npm install` to update node version
4. npm install better-sqlite3 --update-binaries
5. if this does not work run `npm rebuild` or `npm i --save-dev @types/better-sqlite3`
