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

## Info
<p>Documentation will be updated.</p>

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
````
Dev server: 
```shell
npm run watch:dev
```

## Docs

### Subscribers
`/src/server/subscribers/`

#### TrackAFK

After each user login, a session and a `last activity` document (timeout) are created. This timeout defines the amount of time a session will remain active in case there is no activity in the session, closing and invalidating the session upon the defined idle period since the last HTTP request received by the web application for a given session ID.
Btw, the same result can be achieved using `createIndexes` - http://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#createIndexes
