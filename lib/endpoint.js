var querystring = require('querystring'),
    http = require('follow-redirects').http,
    request = require('request'),
    fs = require('fs'),
    path = require('path'),
    resolve = require('url').resolve;

var existsSync = (typeof fs.existsSync == 'function') ? fs.existsSync : path.existsSync;

var Endpoint = function(type, o) {

    var path = o.path,
        requiredArgs = o.requiredArgs,
        method = o.method,
        isStream = o.isStream,
        self = this;
        socketPath = o.socketPath
        host = o.host

    this.statusCodes = o.codes;

    var API = function() {
        var id, opts = {}, cb, url, file;

        // assign argumets to a named var
        if (type === 'id') {
            id = arguments[0];

            // allow for options or ignore them
            if (arguments.length > 2) {
                opts = arguments[1];
                cb = arguments[2];
            } else {
                cb = arguments[1];
            }
        } else if(type === 'file') {
            file = arguments[0];

            // allow for options or ignore them
            if (arguments.length > 2) {
                if(typeof(arguments[1]) === 'string') {
                    opts.t = arguments[1];
                } else {
                    opts = arguments[1];
                }
                cb = arguments[2];
            } else {
                cb = arguments[1];
            }
        } else {
            if (arguments.length > 1) {
                opts = arguments[0];
                cb = arguments[1];
            } else {
                opts = {};
                cb = arguments[0];
            }
        }

        this.callback = cb;

        // make sure arguments are passed in correctly
        if (id && (typeof id !== 'string' || id === "")) {
            return this.error('The first argument "ID" should be a string...');
        }

        if (!opts && requiredArgs && requiredArgs.length > 0) {
            return this.error('No arguments were passed to Docker and some were required...');
        }

        for (var key in requiredArgs) {
            if (opts[key] === undefined) {
                return this.error('The ' + key + ' property was not found in the arguments passed to docker and is required...');
            }

            if(requiredArgs[key] === 'string' && typeof(opts[key]) !== 'string') {
                return this.error('The ' + key + ' property is required to be a string and was not');
            }

            if(requiredArgs[key] === 'Array' && typeof(opts[key]) !== 'object') {
                return this.error('The ' + key + ' property is required to be an Array and was not');
            }
                
        }

        if (opts && (file || method === 'GET' || host.indexOf('?') !== -1)) {
            // We have to do this due to the commit endpoint not following the same convention as the rest of the API
            var query_seperator = host.indexOf('?') !== -1 ? '&' : '?';

            url = resolve(host, path.replace('${id}', id)) + query_seperator + querystring.stringify(opts);
            opts = undefined;
        } else {
            url = resolve(host, path.replace('${id}', id));
        }
        requstConfig = {
            encoding: "utf8",
            url: url,
            followAllRedirects: true,
            method: method
        };

        if (opts && method === 'POST' && !file) {
            requstConfig.json = {};
            requstConfig.json = opts;
        }

        if (isStream) {

            if(!file) {
                 path = path + '?' + querystring.stringify(opts)
            }
            //{logs: true, stream: true, stdout:true, stderr:true}
            var options = {
                path: path.replace('${id}', id),
                method: 'POST'
            };

            if(file) {
                var data = querystring.stringify(opts);

                options. headers = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': data.length
                };
            }

            if(socketPath) {
                options.socketPath = socketPath;
                
            } else {
                options.hostname = "localhost";
                options.port = 4243;
            }

            var stream = http.request(options, function() {});

            stream.on('response', function(res) {
                // Allow users to stop the stream
                cb.prototype.end = function() {
                    res.destroy();
                };

                res.setEncoding('utf8');
                res.on('data', function(chunk) {
                    cb(null, chunk);
                });
            });

            stream.on('error', function(error) {
               self.checkStatus(error, {}, error, cb);
            });

            if(file) {
                stream.write(data);
            }
            stream.end();

        } else {
            if(socketPath) {
                requstConfig.socketPath = socketPath;
            }

            if(!file) {
                request(requstConfig, function(err, res, json) {
                    return self.checkStatus(err, res, json, cb);
                });
            } else {
                delete requstConfig.json;
                requstConfig.headers = {'Content-type': "application/tar"};

                fs.createReadStream(file).pipe(request.post(requstConfig, function(err, res, json) {
                    return self.checkStatus(err, res, json, cb);
                }));
            }

        }
    };

    API.prototype.error = function(message) {
        this.callback(message, {});
    };

    return API;
}

Endpoint.prototype.error = function(message) {
    throw message;
};

Endpoint.prototype.checkStatus = function(err, res, json, cb) {
    if (err) return cb(err, null);
    var s = this.validateStatus(res.statusCode.toString());

    if (typeof json === 'string' && !json.isJson()) {
        json = '{"msg": "' + json.replace(/[^a-zA-Z ]/g, "") + '"}';
    } else if (typeof json === 'string') {
        json = JSON.parse(json);
    }

    if (!s.status) {
        var msg = "HTTP response code is " + res.statusCode + " which indicates an error";
        if (json.msg) msg += ": " + json.msg;
        return cb(msg, json);
    }
    if (this.isStream) {
        return cb(null, res);
    } else {
        return cb(null, json);
    }
};

Endpoint.prototype.validateStatus = function(s) {
    if (s in this.statusCodes) {
        return {
            status: this.statusCodes[s] === true,
            msg: this.statusCodes[s]
        };
    }

    return this.error("Docker returned " + s + " a result not supported by this version of the Docker.io for NodeJS");
};


module.exports = Endpoint;