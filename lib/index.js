var request = require('request');
var resolve = require('url').resolve;
var querystring = require('querystring');

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
        statusCodes = o.codes;

    return function() {
        var id, opts, cb, url;

        // assign argumets to a named var
        if (type === 'id') {
            id = arguments[0];

            // allow for options or ignore them
            if(arguments.length > 2) {
                opts = arguments[1];
                cb = arguments[2];
            } else {
                cb = arguments[1];
            }
        } else {
            opts = arguments[0];
            cb = arguments[1];
        }

        // make sure arguments are passed in correctly
        if(id && typeof id !== 'string') {
            this.error('The first argument "ID" should be a string...');
        }

        if(!opts && requiredArgs && requiredArgs.length > 0) {
            this.error('No arguments were passed to Docker and some were required...');
        }

        for(var arg in requiredArgs) {
            if(opts[arg] === undefined) {
                this.error('The ' + arg + ' property was not found in the arguments passed to docker and is required...');
            }
        }

        if(opts && method === 'GET') {
            url = resolve(host, path.replace('${id}', id)) + '?' + querystring.stringify(opts);
            opts = undefined;
        } else {
            url = resolve(host, path.replace('${id}', id));
        }
        requstConfig = {
            timeout: 10000,
            url: url,
            method: method
        };

        if(opts && method === 'POST') {
            requstConfig.json = {};
            requstConfig.json = opts;
        }

        request(requstConfig, function(err, res, json) {
            return this.checkStatus(err, res, json, cb);
        });
    };
}

Endpoint.prototype.Error = function(message) {
    throw "[Docker module] - " + message;
};

Endpoint.prototype.Error = function(message) {
    throw "[Docker module] - " + message;
};

Endpoint.prototype.validateStatus = function(s) {
    if (s in statusCodes) {
        return {
            status: statusCodes[s] === true,
            msg: statusCodes[s]
        };
    }

    throw "Docker returned a result not supported by this version of the Docker.js wrapper";
};

Endpoint.prototype.checkStatus = function(err, res, json, cb) {
    if (err) return cb(err, null);
    var s = validateStatus(res.statusCode.toString());

    if(typeof json === 'string' && !json.isJson()) {
        json = '{"msg": "' + json.replace(/[^a-zA-Z ]/g,"") + '"}';
    } else if(typeof json === 'string') {
        json = JSON.parse(json);
    }

    if (!s.status) {
        var msg = "HTTP response code is " + res.statusCode + " which indicates an error";
        if (s.msg) msg += ": " + json.msg;
        return cb(msg, json);
    }
    return cb(null, json);
};

module.exports = function(opts) {
    opts = opts || {};

    var port = opts.port || '4243';
    host =  opts.host || "http://localhost";
    host = host + ':' + port;

    return {
        containers: {
            list: new Endpoint('options', {
                path: '/containers/ps',
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
                path:'/containers/${id}/json',
                method: 'GET',
                codes: {
                    200: true,
                    404: "no such container",
                    500: "server error"
                }
            }),
            inspectChanges: new Endpoint('id', {
                path:'/containers/${id}/changes',
                method: 'GET',
                codes: {
                    200: true,
                    404: "no such container",
                    500: "server error"
                }
            }),
            runExport: new Endpoint('id', {
                path:'/containers/${id}/export',
                method: 'GET',
                codes: {
                    200: true,
                    404: "no such container",
                    500: "server error"
                }
            }),
            start: new Endpoint('id', {
                path:'/containers/${id}/start',
                method: 'POST',
                codes: {
                    204: true,
                    404: "no such container",
                    500: "server error"
                }
            }),
            stop: new Endpoint('id', {
                path:'/containers/${id}/stop',
                method: 'POST',
                codes: {
                    204: true,
                    404: "no such container",
                    500: "server error"
                }
            }),
            restart: new Endpoint('id', {
                path:'/containers/${id}/restart',
                method: 'POST',
                codes: {
                    204: true,
                    404: "no such container",
                    500: "server error"
                }
            }),
            kill: new Endpoint('id', {
                path:'/containers/${id}/kill',
                method: 'POST',
                codes: {
                    204: true,
                    400: "bad parameter",
                    404: "no such container",
                    500: "server error"
                }
            }),
            remove: new Endpoint('id', {
                path:'/containers/${id}',
                method: 'DELETE',
                codes: {
                    204: true,
                    400: "bad parameter",
                    404: "no such container",
                    500: "server error"
                }
            }),
            attach: new Endpoint('id', {
                path:'/containers/${id}/attach',
                codes: {
                    200: true,
                    404: "no such container",
                    500: "server error"
                }
            }),
            wait: new Endpoint('options', {
                path:'/containers/',
                codes: {
                    201: true,
                    404: "no such container",
                    500: "server error"
                }
            })

        }
    }

}