String.prototype.isJson = function() {
    try {
        JSON.parse(this);
    } catch (e) {
        return false;
    }
    return true;
};


var Endpoint = require('./endpoint');

var Docker = function(opts) {
    opts = opts || {};

    var socketPath,
        version = opts.version || "v1.4",
        port = opts.port || '4243',
        host = opts.host || "http://localhost",
        host = host + ':' + port + '/' + version;

    if(socketPath !== false || socketPath === undefined) {
        socketPath = opts.socketPath || '/var/run/docker.sock';
    }

    return {
        containers: {
            list: new Endpoint('options', {
                path: '/containers/json',
                method: 'GET',
                codes: {
                    200: true,
                    400: "bad parameter",
                    500: "server error"
                },
                host: host,
                socketPath: socketPath
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
                },
                host: host,
                socketPath: socketPath
            }),
            inspect: new Endpoint('id', {
                path: '/containers/${id}/json',
                method: 'GET',
                codes: {
                    200: true,
                    404: "no such container",
                    500: "server error"
                },
                host: host,
                socketPath: socketPath
            }),
            inspectChanges: new Endpoint('id', {
                path: '/containers/${id}/changes',
                method: 'GET',
                codes: {
                    200: true,
                    404: "no such container",
                    500: "server error"
                },
                host: host,
                socketPath: socketPath
            }),
            runExport: new Endpoint('id', {
                path: '/containers/${id}/export',
                method: 'GET',
                codes: {
                    200: true,
                    404: "no such container",
                    500: "server error"
                },
                host: host,
                socketPath: socketPath
            }),
            start: new Endpoint('id', {
                path: '/containers/${id}/start',
                method: 'POST',
                codes: {
                    204: true,
                    404: "no such container",
                    500: "server error"
                },
                host: host,
                socketPath: socketPath
            }),
            stop: new Endpoint('id', {
                path: '/containers/${id}/stop',
                method: 'POST',
                codes: {
                    204: true,
                    404: "no such container",
                    500: "server error"
                },
                host: host,
                socketPath: socketPath
            }),
            restart: new Endpoint('id', {
                path: '/containers/${id}/restart',
                method: 'POST',
                codes: {
                    204: true,
                    404: "no such container",
                    500: "server error"
                },
                host: host,
                socketPath: socketPath
            }),
            kill: new Endpoint('id', {
                path: '/containers/${id}/kill',
                method: 'POST',
                codes: {
                    204: true,
                    400: "bad parameter",
                    404: "no such container",
                    500: "server error"
                },
                host: host,
                socketPath: socketPath
            }),
            remove: new Endpoint('id', {
                path: '/containers/${id}',
                method: 'DELETE',
                codes: {
                    204: true,
                    400: "bad parameter",
                    404: "no such container",
                    500: "server error"
                },
                host: host,
                socketPath: socketPath
            }),
            attach: new Endpoint('id', {
                path: '/containers/${id}/attach',
                method: 'POST',
                isStream: true,
                codes: {
                    200: true,
                    404: "no such container",
                    500: "server error"
                },
                host: host,
                socketPath: socketPath
            }),
            wait: new Endpoint('options', {
                path: '/containers/${id}/wait',
                method: 'POST',
                isStream: true,
                codes: {
                    201: true,
                    404: "no such container",
                    500: "server error"
                },
                host: host,
                socketPath: socketPath
            })

        },
        images: {
            list: new Endpoint('options', {
                path: '/images/json',
                method: 'GET',
                codes: {
                    200: true,
                    400: "bad parameter",
                    500: "server error"
                },
                host: host,
                socketPath: socketPath
            })

        },
        info: new Endpoint('options', {
            path: '/info',
            method: 'GET',
            codes: {
                200: true,
                500: "server error"
            },
            host: host,
            socketPath: socketPath
        }),
        version: new Endpoint('options', {
            path: '/version',
            method: 'GET',
            codes: {
                200: true,
                500: "server error"
            },
            host: host,
            socketPath: socketPath
        }),
        setAuth: new Endpoint('options', {
            path: '/auth',
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
            },
            host: host,
            socketPath: socketPath
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
            },
            host: host,
            socketPath: socketPath
        }),
        build: new Endpoint('file', {
            path: '/build',
            method: 'POST',
            codes: {
                200: true,
                500: "server error"
            },
            host: host,
            socketPath: socketPath
        })
    };
};

module.exports = Docker;