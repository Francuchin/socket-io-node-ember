'use strict'
/*--- AUX ---*/
Array.prototype.Remover = id => {
    return Array.prototype.filter(el => {
        return el.id !== id;
    });
};
/*--- AUX ---*/
let app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    request = require('request'),
    cors = require('cors'),
    usuarios = [],
    salas = [{
        id: 1,
        usuarios: [1, 2]
    }, {
        id: 2,
        usuarios: [3, 2]
    }, {
        id: 3,
        usuarios: [1, 3]
    }, {
        id: 4,
        usuarios: [1, 2, 3],
    }],
    inicio = () => {
        app.use(cors());
        app.options('*', cors());

        http.listen(8000, () => console.log('Corriendo en *:80'));

        io.on('connection', socket => { // conectando socket
            if (socket.handshake.query.usuario !== undefined) {
                ingresaUusario(socket, socket.handshake.query.usuario)
                socket.on('disconnect', () => saleUsuario(socket.handshake.query.usuario));
            }
        }); // fin conectando socket

        app.get('/mensaje', function(req, res) {
            let mensaje = req.query.mensaje,
                usuario = req.query.usuario,
                sala = req.query.sala;
            getUsuarios(sala).then(us => {
                for (let i = 0; i < us.length; i++)
                    for (let j = 0; j < usuarios.length; j++)
                        if (us[i] == usuarios[j].id)
                            usuarios[j].socket.emit('mensaje', {
                                id: usuario,
                                texto: mensaje,
                                sala: sala
                            });
            });
            res.json({
                resultado: "listo"
            });
        });

        app.get('/nuevaSala', function(req, res) {
            let id = req.query.id, // id sala
                u1 = req.query.usuario1, // quien invita
                u2 = req.query.usuario2 // aquien se invita
            if (id != undefined) {
                salas.push({
                    id: id,
                    usuarios: [u1, u2]
                })
                for (var i = 0; i < usuarios.length; i++)
                    if (usuarios[i].id == u1 || usuarios[i].id == u2)
                        usuarios[i].socket.emit('nuevaSala', {
                            id: id,
                            usuarios: [u1, u2]
                        });
                res.json({
                    resultado: "listo"
                });
            } else res.json({
                resultado: "error"
            });
        });
        // Borrrar esto me lo da rails
        app.get('/sala', function(req, res) {
            let id_sala = req.query.id_sala
            for (let i = 0; i < salas.length; i++)
                if (salas[i].id == id_sala) res.json(salas[i]);
            res.json([]);
        })
        app.get('/login', function(req, res) {
            let usuario = req.query.identification
            let pass = req.query.password
            res.json({
                id: 1,
                email: usuario,
                password: pass
            });
        })
    },
    getUsuarios = id_sala => new Promise((ok) => {
        for (let i = 0; i < salas.length; i++)
            if (salas[i].id == id_sala) {
                return ok(salas[i].usuarios);
            }
        request('http://localhost:3000/sala?id_sala=' + id_sala, (error, response, sala) => {
            salas.push(sala);
            return ok(sala.usuarios);
        });
    }),
    ingresaUusario = (socket, id_usuario) => {
        console.log("Se conecta usuario: " + id_usuario)
        usuarios.push({
            id: id_usuario,
            socket: socket
        });
    },
    saleUsuario = id_usuario => {
        //usuarios = usuarios.Remover(socket.handshake.query.usuario) // remuevo al usuario
        console.log("Usuario " + id_usuario + " desconectada")
    }


inicio();