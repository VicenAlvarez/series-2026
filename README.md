# Series 2026

En este proyecto he creado una API REST para consultar series que llegaron al catálogo español de Netflix, Prime Video, Disney+ y HBO Max durante 2026. Lo que cuenta es la fecha en la que la serie se añadió a la plataforma, aunque se estrenara antes.

Se puede consultar el catálogo por plataforma y género. Los usuarios pueden registrarse con una imagen y guardar sus series favoritas.

## Instalación

Para ejecutar el proyecto necesitas Node.js, un clúster de MongoDB Atlas y una cuenta de Cloudinary.

1. Descarga o clona el repositorio y abre una terminal en la carpeta del proyecto.
2. Instala las dependencias:

   ```bash
   npm ci --legacy-peer-deps
   ```

   La opción `--legacy-peer-deps` permite instalar `multer-storage-cloudinary` junto con Cloudinary 2.

3. Copia `.env.example` a un archivo llamado `.env` y completa estas variables:

   ```env
   PORT=3000
   MONGO_URI=
   JWT_SECRET=
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
   ```

   `MONGO_URI` es la cadena de conexión de Atlas, `JWT_SECRET` es la clave privada para firmar los tokens y las tres últimas variables se obtienen en Cloudinary. Autoriza tu IP en Atlas para que el servidor pueda conectarse. La base de datos se llama `series2026`.

4. Arranca el servidor:

   ```bash
   npm run dev
   ```

Abre `http://localhost:3000` para comprobar que aparece el mensaje «API de series 2026 funcionando».

## Modelos

- **Usuario:** guarda el nombre, el correo, la contraseña como hash, el rol, la imagen y sus series favoritas. Los favoritos son referencias al modelo `Serie`. Al añadir una serie se conservan las anteriores y, si ya está en la lista, no se vuelve a añadir.
- **Serie:** guarda el título, la descripción, los géneros y las incorporaciones. Cada incorporación tiene una plataforma y una fecha. La API comprueba que la serie tenga al menos un género y una incorporación, que la plataforma esté permitida y que la fecha sea de 2026.

## Registro, login y permisos

Para registrarte en Insomnia, envía `POST /api/users/register` con **Body → Form Data**. Añade `name`, `email` y `password` como texto, e `image` como archivo. La contraseña debe tener al menos ocho caracteres. Todas las cuentas se crean con el rol `user`.

Para iniciar sesión, envía `POST /api/users/login` con el correo y la contraseña en JSON:

```json
{
  "email": "usuario@example.com",
  "password": "ContraseñaDePrueba"
}
```

Copia el `token` de la respuesta. En las peticiones protegidas, selecciona **Auth → Bearer Token** en Insomnia y pega el token.

El primer administrador se crea registrando una cuenta y cambiando su campo `role` a `admin` en la colección `users` de MongoDB Atlas. A partir de ahí, los administradores pueden cambiar el rol de otras cuentas desde la API.

Un usuario normal puede eliminar su propia cuenta, y un administrador también puede eliminar cuentas ajenas. Si la cuenta tiene imagen, al borrarla se elimina también el archivo de Cloudinary.

## Rutas de usuarios

| Método | Ruta | Acceso | Datos |
|---|---|---|---|
| POST | `/api/users/register` | Público | `name`, `email`, `password` e `image` en Form Data |
| POST | `/api/users/login` | Público | `email` y `password` en JSON |
| GET | `/api/users` | Administrador | Sin cuerpo |
| GET | `/api/users/profile` | Usuario autenticado | Sin cuerpo |
| PUT | `/api/users/profile` | Propio usuario | `name`, `email` o ambos en JSON |
| PUT | `/api/users/profile/image` | Propio usuario | Archivo `image` en Form Data |
| POST | `/api/users/favorites/:serieId` | Propio usuario | ID de la serie en la URL |
| DELETE | `/api/users/favorites/:serieId` | Propio usuario | ID de la serie en la URL |
| PUT | `/api/users/:id/role` | Administrador | `role` con valor `user` o `admin` en JSON |
| DELETE | `/api/users/:id` | Propio usuario o administrador | ID del usuario en la URL |

## Rutas de series

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/series` | Público |
| GET | `/api/series/:id` | Público |
| POST | `/api/series` | Administrador |
| PUT | `/api/series/:id` | Administrador |
| DELETE | `/api/series/:id` | Administrador |

Ejemplo de JSON para crear una serie:

```json
{
  "title": "Serie de ejemplo",
  "description": "Descripción de la serie",
  "genres": ["Drama"],
  "incorporations": [
    {
      "platform": "Netflix",
      "addedAt": "2026-03-15"
    }
  ]
}
```

Al editar, puedes enviar solo los campos que quieras cambiar. Al eliminar una serie, también se quita de los favoritos de los usuarios.

Puedes filtrar el catálogo con `platform`, `genre` o los dos a la vez:

```text
/api/series?platform=Netflix
/api/series?genre=Drama
/api/series?platform=Netflix&genre=Drama
```

Para filtrar por Disney+, escribe `platform=Disney%2B`.

## Semilla

Para cargar las cuatro series iniciales, ejecuta desde la carpeta del proyecto:

```bash
npm run seed
```

La semilla lee los datos de `src/data/series.js` e inserta los títulos que aún no están guardados. Si la ejecutas otra vez, conserva las series existentes y no vuelve a insertar esos títulos.