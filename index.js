'use strict'
/*--- AUX ---*/

let removeItem = (array, id) => array.forEach((result, index) => {
    if (array[index].id == id) array.splice(index, 1);
});

/*--- AUX ---*/
let app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    request = require('request'),
    cors = require('cors'),
    usuarios = [],
    salas = [],
    port = process.env.PORT || 8080;

let getUsuarios = id_sala => new Promise((ok) => {
    for (let i = 0; i < salas.length; i++)
        if (salas[i].id == id_sala) {
            return ok(salas[i].usuarios);
        }
    console.log("rebuscando");
    request('https://redtipsocket.herokuapp.com/sala?id_sala=' + id_sala, (error, response, sala) => {
        salas.push(sala);
        return ok(sala.usuarios);
    });
})
let ingresaUusario = (socket, id_usuario) => {
    console.log("Se conecta usuario: " + id_usuario)
    for (let i = 0; i < usuarios.length; i++)
        if (id_usuario == usuarios[i].id) {
            usuarios[i].socket = socket;
            return;
        }
    usuarios.push({
        id: id_usuario,
        socket: socket
    });
}
let saleUsuario = id_usuario => removeItem(usuarios, id_usuario)
app.use(cors());
app.options('*', cors());
http.listen(port, () => console.log('Corriendo en puerto ' + port));
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
    console.log("Enviando")
    console.log(mensaje + " - " + usuario + " " + sala)
    getUsuarios(sala).then(us => {
        for (let i = 0; i < us.length; i++)
            for (let j = 0; j < usuarios.length; j++)
                if (us[i] == usuarios[j].id) {
                    console.log("Enviado a " + usuarios[j].id)
                    usuarios[j].socket.emit('mensaje', {
                        id: usuario,
                        texto: mensaje,
                        sala: sala
                    });
                }
    });
    res.json({
        resultado: "listo"
    });
});
// falta completar
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
        if (salas[i].id == id_sala) {
            res.json(salas[i]);
            return;
        }
    res.json([]);
})