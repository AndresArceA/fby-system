const express = require('express');
const results = require('./data/agentes.js');
const agentes = results;
const app = express();
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

app.use(express.json())

// Defino Puerto para el Servidor
const PORT = 3000;
//Arranco Servidor
app.listen(PORT, () => console.log(`Cyber Crime FBI Server Running on port ${PORT}`));

//defino la secret key
const secretKey = "elHuachimingo";

//defino tiempo actual y tiempo de duracion del token
const segActuales = Math.floor(Date.now() / 1000); // Tiempo actual en segundos
//console.log(segActuales);
//console.log(Date.now());
const T = 120 // variable para la duracion del tiempo en segundos
const tExpira = segActuales + T; // sumo 120 segundos = 2 minutos

//ruta para cargar index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/index.html"), (err) => {
    if (err) {
      console.error("Error al enviar index.html:", err);
      res.status(404).sendFile(path.join(__dirname, "/404.html")); // Redirige a la página 404 si hay un error al enviar el archivo
    }
  });
});
   
// 1.- Ruta SignIn, para autenticar al agente con sus credenciales y genera un token
app.get("/signin", (req, res) => {
        const { email, password } = req.query;
    const agente = agentes.find((a) => a.email == email && a.password == password); //autentifica los valores en el arreglo de agentes.js
    if (agente) { //si existe el agente genero el token
        // Genero el token
        const token = jwt.sign({
                               exp: tExpira, //tiempo de expiracion del token definido anteriormente
                               data: agente,
                               iat: segActuales //corresponde al tiempo en que se emite el token
                               }, secretKey);
        console.log("token gen: "+ token + tExpira);
        // como respuesta del servidor envío html que incluye enlace a zona privada, envía token como query string
        res.send(`
            <a href="/private?token=${token}"> <p> Ir su Pagina Privada </p></a>
            Bienvenido, ${email}.

            <script>
                sessionStorage.setItem('token', '${token}')
            </script>`
        );
    } else {
       res.status(401).send(`
        <script>
            alert("Usuario o contraseña Incorrecta -- Reintente");
            window.location.href = '${req.headers.referer || "/"}';
        </script>`)
    }

});

// creo ruta privada validando si existe el token, si no existe envio cod 401 y mensaje, luego al cerrar mensaje vuelvo a ruta raiz
app.get('/private', (req, res) => {
    console.log("Bienvenido a su Sesión Privada");
    const token = req.query.token;
    if (!token) {
        res.status(401).send(`
            <script>
                alert("No existe el token, no está Autorizado para acceder");
                window.location.href = '${"/"}';
            </script>`);
    } else { // si existe el token, se realiza la verificación, si está expirado , devuelvo codigo 403 y mensaje , luego vuelvo a ruta raiz
        jwt.verify(token, secretKey, (err, data) => {
            if (err) {
                res.status(403).send(`
                <script>
                    alert("Token Inválido, probablememte ya expiró");
                    window.location.href = '${"/"}';
                </script>`);
            } else { // si pasa validación  defino tiempo de expiracion y email de agente para incorporarlo a respuesta del servidor
                const tiempoExpiracion = data.exp;
                const email = data.data.email;
                
                
                // Envío HTML con pagina privada, incluyo datos del agente y un contador regresivo que indica tiempo de vida de la sesión,
                // cuando se acabe la vida del token, se avisa y se vuelve a la ruta raiz.
                res.status(200).send(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Dashboard</title>
                    </head>
                    <body>
                        <h1>Bienvenido la zona Privada</h1>
                        <p>Autorizado a la ruta: ${email}</p>
                        <p>La sesión expira en: ${T} seg.</p>
                        <p id="contador"></p>
                        <h2> Pr favor vea la siguiente información relevante para su misión</h2>
                        <div id="contenedor-video">
                        <iframe width="640" height="480" src="https://www.youtube.com/embed/xIaXl7SqkBw" title="Magnum, P.I. - Opening Theme" frameborder="0" allow="accelerometer; autoplay="1"; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                        </div>
                        <script>
                            const tiempoExpiracion = ${tiempoExpiracion};
                            const actualizarContador = () => {
                                const tiempoActual = Math.floor(Date.now() / 1000);
                                const tiempoRestante = tiempoExpiracion - tiempoActual;
                                if (tiempoRestante <= 0) {
                                    document.getElementById('contador').innerText = "El token ha expirado, será redirigido al inicio de sesión.";
                                    setTimeout(() => {window.location.href = '${"/"}'},2000);
                                } else {
                                    document.getElementById('contador').innerText = "Tiempo restante para la expiración del token: " + tiempoRestante + " segundos";
                                    setTimeout(actualizarContador, 1000);
                                }
                            };
                            actualizarContador();
                        </script>
                    </body>
                    </html>
                `);
            }
        });
    }
});



