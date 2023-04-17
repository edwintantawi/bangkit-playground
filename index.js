require('dotenv').config();
const Hapi = require('@hapi/hapi');
const { Client } = require('pg');
const { Storage } = require('@google-cloud/storage');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    // debug: {
    //   request: ['error'],
    // },
  });

  const client = new Client({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
  });

  await client.connect();

  const storage = new Storage();

  server.route([
    {
      method: 'GET',
      path: '/',
      handler: async (_, h) => {
        const result = await client.query('SELECT NOW() as time');

        return h
          .response({
            status: 'OK',
            message: 'server running',
            payload: result.rows[0],
          })
          .code(200);
      },
    },
    {
      method: 'POST',
      path: '/uploads',
      options: {
        payload: {
          multipart: true,
          output: 'stream',
          maxBytes: 7 << 20,
        },
      },
      handler: async (request, h) => {
        const payload = request.payload;

        // const file = storage
        //   .bucket(BUCKET_NAME)
        //   .file(payload.file.hapi.filename);

        // await file.save(payload.file._data);

        // const url = file.publicUrl();

        const url = await writeFile(storage, payload.file);

        return h
          .response({
            status: 'OK',
            payload: { url },
          })
          .code(200);
      },
    },
  ]);

  await server.register({
    name: 'error',
    register: (server) => {
      server.ext({
        type: 'onPreResponse',
        method: (server, h) => {
          if (server.response.isBoom) {
            console.error(server.response.message);
            return h
              .response({
                status: 'ERROR',
                message: server.response.message,
              })
              .code(500);
          }

          return h.continue;
        },
      });
    },
  });

  await server.start();
  console.log(`server running at ${server.info.uri}`);
};

function writeFile(storage, source) {
  const BUCKET_NAME = 'bangkit-playground-bucket';

  const file = storage.bucket(BUCKET_NAME).file(source.hapi.filename);

  return new Promise((resolve, reject) => {
    const stream = file.createWriteStream();
    stream.on('finish', () => {
      const url = file.publicUrl();
      resolve(url);
    });
    stream.on('error', (error) => reject(error));
    source.pipe(stream);
  });
}

init();
