copy private key from github to `scripts/private-key.pem`

needed to convert the private key from github to pkcs8 format

```sh
chmod +x scripts/convert-key.sh
cd scripts
./convert-key.sh
```

https://github.com/gr2m/universal-github-app-jwt#private-key-formats

then convert to base64 and add to .dev.vars

```sh
cd scripts
node ./encode-key.js
```
