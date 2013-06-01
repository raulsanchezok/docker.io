docker.js
=========

Node.JS wrapper for low-level Docker.io HTTP interface

## Usage

```javascript

var docker = require('docker.js')({host:"http://localhost", port: "4243"});


```

We have implamented most of the container methods like:

- list

```javascript

function handler(err, res) {
    if (err) throw err;
    console.log("data returned from Docker as JS object: ", res);
}

var options = {}; // all options listed in the REST documentation for Docker are supported.

docker.containers.list(options, handler);

```

- create

```javascript

function handler(err, res) {
    if (err) throw err;
    console.log("data returned from Docker as JS object: ", res);
}

var options = {}; // all options listed in the REST documentation for Docker are supported.

docker.containers.create(options, handler);

```

- inspect

```javascript

function handler(err, res) {
    if (err) throw err;
    console.log("data returned from Docker as JS object: ", res);
}

var options = {}; // all options listed in the REST documentation for Docker are supported.

docker.containers.inspect('263tbr762t37rtbd', options, handler);
// OR
docker.containers.inspect('263tbr762t37rtbd', handler);


```

- inspectChanges

```javascript

function handler(err, res) {
    if (err) throw err;
    console.log("data returned from Docker as JS object: ", res);
}

var options = {}; // all options listed in the REST documentation for Docker are supported.

docker.containers.inspectChanges('263tbr762t37rtbd', options, handler);
// OR
docker.containers.inspectChanges('263tbr762t37rtbd', handler);

```

- runExport

```javascript

function handler(err, res) {
    if (err) throw err;
    console.log("data returned from Docker as JS object: ", res);
}

var options = {}; // all options listed in the REST documentation for Docker are supported.

docker.containers.runExport('263tbr762t37rtbd', options, handler);
// OR
docker.containers.runExport('263tbr762t37rtbd', handler);
```

- start

```javascript

function handler(err, res) {
    if (err) throw err;
    console.log("data returned from Docker as JS object: ", res);
}

var options = {}; // all options listed in the REST documentation for Docker are supported.

docker.containers.start('263tbr762t37rtbd', options, handler);
// OR
docker.containers.start('263tbr762t37rtbd', handler);
```

Other methods are implamented but a little buggy... PULL REQUESTS ARE WELCOME!