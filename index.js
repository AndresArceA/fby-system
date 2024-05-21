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

const secretKey = "elHuachimingo";

const segActuales = Math.floor(Date.now() / 1000); // Tiempo actual en segundos
const tExpira = segActuales + 50; // sumo 120 segundos = 2 minutos

//console.log("Valor de min :"+ segActuales/60);

//ruta para cargar index.html
app.get("/", (req, res) => {
    try {
      res.sendFile(path.join(__dirname, "/index.html"), (err) => {
        if (err) {
          console.error("Error al enviar index.html:", err);
          res.sendFile(path.join(__dirname, "/404.html")); // Redirigir a la página 404 si hay un error al enviar el archivo
        }
      });
    } catch (error) {
      const EE = errores(error.code, error.status, error.message);
      console.log("Error", error);
      res.status(EE.status).json({
        message: EE.message,
      });
    }
  });
// 1.- Ruta SignIn
app.get("/signin", (req, res) => {
    // Paso 2
    const { email, password } = req.query;
    // Paso 3
    const agente = agentes.find((a) => a.email == email && a.password == password); //autentifica los valores en el arreglo de agentes.js
    // Paso 4
    if (agente) { //si existe el agente genero el token
        
        // Genero el token
        const token = jwt.sign({
                               exp: tExpira,
                               data: agente,
                               iat: segActuales //corresponde al tiempo en que se emite el token
                               }, secretKey);
        console.log("token gen: "+ token);
        // Paso 6
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

app.get('/private', (req, res) => {
    console.log("Bienvenido a la ruta Privada");
    const token = req.query.token;
    if (!token) {
        res.status(401).send(`
            <script>
                alert("No existe el token, no está Autorizado para acceder");
                window.location.href = '${"/"}';
            </script>`);
    } else {
        jwt.verify(token, secretKey, (err, data) => {
            if (err) {
                res.status(403).send(`
                <script>
                    alert("Token Inválido, probablememte ya expiró");
                    window.location.href = '${"/"}';
                </script>`);
            } else {
                const tiempoExpiracion = data.exp;
                const email = data.data.email;
                
                // Enviar HTML con el contador regresivo
                res.send(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Dashboard</title>
                    </head>
                    <body>
                        <h1>Bienvenido la zona Privada</h1>
                        <p>Autorizado a la ruta: ${email}</p>
                        <p id="contador"></p>
                        <h2> Pr favor vee la siguiente información relevane para tu misión</h2>
                        <div id="contenedor-video">
                        <iframe width="938" height="514" src="https://www.youtube.com/embed/xIaXl7SqkBw" title="Magnum, P.I. - Opening Theme" frameborder="0" allow="accelerometer; "&autoplay=1"; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
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
// app.get('/dashboard',  (req, res) => {
//     console.log("Bienvenido a la ruta Dashboard")
//     const token = req.query.token;
//     if (!token) {
//         res.status(401).send("No hay token, no esta Autorizado");
//     } else {
//         jwt.verify(token, secretKey, (err, data) => {
//             console.log("Valor de Data: ", data);
//             err ? 
//             res.status(403).send("Token inválido o ha expirado")
//             : 
//             res.status(200).send("Autorizado a la ruta: "+data.data.email );
//         });
//     }



