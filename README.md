<pre>
   ___       ___                      __                                        ___                
 /'___\  __ /\_ \                    /\ \__                                   /'___\               
/\ \__/ /\_\\//\ \       __          \ \ ,_\  _ __    __       ___      ____ /\ \__/    __   _ __  
\ \ ,__\\/\ \ \ \ \    /'__`\  _______\ \ \/ /\`'__\/'__`\   /' _ `\   /',__\\ \ ,__\ /'__`\/\`'__\
 \ \ \_/ \ \ \ \_\ \_ /\  __/ /\______\\ \ \_\ \ \//\ \L\.\_ /\ \/\ \ /\__, `\\ \ \_//\  __/\ \ \/ 
  \ \_\   \ \_\/\____\\ \____\\/______/ \ \__\\ \_\\ \__/.\_\\ \_\ \_\\/\____/ \ \_\ \ \____\\ \_\ 
   \/_/    \/_/\/____/ \/____/           \/__/ \/_/ \/__/\/_/ \/_/\/_/ \/___/   \/_/  \/____/ \/_/
</pre>

![CodeQL](https://github.com/loveyousomuch554/file-transfer/workflows/CodeQL/badge.svg?branch=main)

# Info

<p>Documentation will be updated. 🙂</p>

Current stage of the project: <u>working on project documentation</u>.

#### Frequent errors:

Error while installing npm modules:

```shell
Error: 
  Cannot find module 'path_to_my_project/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node'
```

Solution: <br>

```Shell
cd node_modules/bcrypt
node-pre-gyp install --fallback-to-build
```

## Testing

<p>For testing with logs run the following commands:</p>

```shell
npm run test
```

Without logs:

```shell
npm run test -- --silent
```

## Server

Run server:     

```shell
npm run prod
```

Dev server: 

```shell
npm run watch:dev
```

## Additional information

## Docker-compose MongoDB Cluster (replica set)

### [Keyfile Security](https://docs.mongodb.com/manual/tutorial/deploy-replica-set-with-keyfile-access-control/index.html#keyfile-security)

The replica set uses the Key file. Key files are minimal forms of security and are best suited for test or development environments. For production environments, we recommend using [x.509 certificates](https://docs.mongodb.com/manual/core/security-x.509/).

To generate a key file use the following command:
``` shell
openssl rand -base64 700 > file.key
chmod 400 file.key
```

Run docker-compose: `docker-compose up --build -d`

### Subscribers

`/src/server/subscribers/`

#### TrackAFK

After each user login, a session and a `last activity` document (timeout) are created. This timeout defines the amount of time a session will remain active in case there is no activity in the session, closing and invalidating the session upon the defined idle period since the last HTTP request received by the web application for a given session ID.
Btw, the same result can be achieved using `createIndexes` - <http://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#createIndexes>
