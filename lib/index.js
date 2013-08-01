var querystring = require('querystring');
var http = require('follow-redirects').http
var request = require('request');
var fs = require('fs');
var path = require('path');
var resolve = require('url').resolve;

var existsSync = (typeof fs.existsSync == 'function') ? fs.existsSync : path.existsSync;


var host;

String.prototype.isJson = function() {
    try {
        JSON.parse(this);
    } catch (e) {
        return false;
    }
    return true;
};

function Endpoint(type, o) {

    var path = o.path,
        requiredArgs = o.requiredArgs,
        method = o.method,
        isStream = o.isStream,
        self = this;

    this.statusCodes = o.codes;

    var API = function() {
        var id, opts, cb, url;

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

            if(requiredArgs[key] === 'filepath' && typeof(opts[key]) !== 'string') {
                return this.error('The ' + key + ' property is required to be a path to a file and was not');
            }

            if(requiredArgs[key] === 'filepath' && !existsSync(opts[key])) {
                return this.error('No file found at path: '+ opts[key]);
            }
        }

        if (opts && (method === 'GET' || host.indexOf('?') !== -1)) {
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

        if (opts && method === 'POST') {
            requstConfig.json = {};
            requstConfig.json = opts;
        }

        if (isStream) {
            var data = querystring.stringify(opts);
            var options = {
                hostname: "localhost",
                port: 4243,
                path: path.replace('${id}', id),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': data.length
                }
            };

            var stream = http.request(options, function() {});

            stream.on('response', function(res) {
                // Allow users to stop the stream
                cb.prototype.end = function() {
                    res.destroy();
                };

                res.setEncoding('utf8');
                res.on('data', function(chunk) {
                    self.checkStatus(false, res, chunk, cb);
                });

                self.checkStatus(false, res, "", cb);
            });

            stream.on('error', function(error) {
               self.checkStatus(error, {}, error, cb);
            });

            stream.write(data);
            stream.end();

        } else {
            request(requstConfig, function(err, res, json) {
                return self.checkStatus(err, res, json, cb);
            });
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
    return cb(null, json);
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

var Docker = function(opts) {
    opts = opts || {};

    var version = opts.version || "v1.4";
    var port = opts.port || '4243';
    host = opts.host || "http://localhost";
    host = host + ':' + port + '/' + version;

    return {
        containers: {
            list: new Endpoint('options', {
                path: '/containers/json',
                method: 'GET',
                codes: {
                    200: true,
                    400: "bad parameter",
                    500: "server error"
                }
            }),
            create: new Endpoint('options', {
                path: '/containers/create',
                method: 'POST',
                requiredArgs: {
                    Image: 'string',
                    Cmd: 'Array'
                },
                codes: {
                    201: true,
                    404: "no such container",
                    500: "server error"
                }
            }),
            inspect: new Endpoint('id', {
                path: '/containers/${id}/json',
                method: 'GET',
                codes: {
                    200: true,
                    404: "no such container",
                    500: "server error"
                }
            }),
            inspectChanges: new Endpoint('id', {
                path: '/containers/${id}/changes',
                method: 'GET',
                codes: {
                    200: true,
                    404: "no such container",
                    500: "server error"
                }
            }),
            runExport: new Endpoint('id', {
                path: '/containers/${id}/export',
                method: 'GET',
                codes: {
                    200: true,
                    404: "no such container",
                    500: "server error"
                }
            }),
            start: new Endpoint('id', {
                path: '/containers/${id}/start',
                method: 'POST',
                codes: {
                    204: true,
                    404: "no such container",
                    500: "server error"
                }
            }),
            stop: new Endpoint('id', {
                path: '/containers/${id}/stop',
                method: 'POST',
                codes: {
                    204: true,
                    404: "no such container",
                    500: "server error"
                }
            }),
            restart: new Endpoint('id', {
                path: '/containers/${id}/restart',
                method: 'POST',
                codes: {
                    204: true,
                    404: "no such container",
                    500: "server error"
                }
            }),
            kill: new Endpoint('id', {
                path: '/containers/${id}/kill',
                method: 'POST',
                codes: {
                    204: true,
                    400: "bad parameter",
                    404: "no such container",
                    500: "server error"
                }
            }),
            remove: new Endpoint('id', {
                path: '/containers/${id}',
                method: 'DELETE',
                codes: {
                    204: true,
                    400: "bad parameter",
                    404: "no such container",
                    500: "server error"
                }
            }),
            attach: new Endpoint('id', {
                path: '/containers/${id}/attach',
                method: 'POST',
                isStream: true,
                codes: {
                    200: true,
                    404: "no such container",
                    500: "server error"
                }
            }),
            wait: new Endpoint('options', {
                path: '/containers/${id}/wait',
                method: 'POST',
                isStream: true,
                codes: {
                    201: true,
                    404: "no such container",
                    500: "server error"
                }
            })

        },
        info: new Endpoint('options', {
            path: '/info',
            method: 'GET',
            codes: {
                200: true,
                500: "server error"
            }
        }),
        version: new Endpoint('options', {
            path: '/version',
            method: 'GET',
            codes: {
                200: true,
                500: "server error"
            }
        }),
        getAuth: new Endpoint('options', {
            path: '/auth',
            method: 'GET',
            codes: {
                200: true,
                500: "server error"
            }
        }),
        setAuth: new Endpoint('options', {
            path: '/info',
            method: 'POST',
            requiredArgs: {
                username: 'string',
                password: 'string',
                email: 'string'
            },
            codes: {
                200: true,
                204: true,
                500: "server error"
            }
        }),
        commit: new Endpoint('id', {
            path: '/commit?container=${id}',
            method: 'POST',
            requiredArgs: {
                repo: 'string',
                tag: 'string',
                message: 'string'
            },
            codes: {
                201: true,
                404: "no such container",
                500: "server error"
            }
        }),
        build: new Endpoint('options', {
            path: '/build',
            isStream: true,
            method: 'POST',
            requiredArgs: {
                file: 'filepath',
                t: 'string',
                q: 'bool'
            },
            codes: {
                200: true,
                500: "server error"
            }
        })
    };
};

module.exports = Docker;