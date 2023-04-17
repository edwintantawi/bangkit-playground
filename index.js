require('dotenv').config();
const Hapi = require('@hapi/hapi');
const { Client } = require('pg');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
  });

  const client = new Client({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
  });

  await client.connect();

  server.route({
    method: 'GET',
    path: '/',
    handler: async (request, h) => {
      const result = await client.query('SELECT NOW() as time');

      return h
        .response({
          status: 'OK',
          message: 'server running',
          payload: result.rows[0],
        })
        .code(200);
    },
  });

  await server.start();
  console.log(`server running at ${server.info.uri}`);
};

init();
