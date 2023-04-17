const Hapi = require('@hapi/hapi');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
  });

  server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      return h
        .response({
          status: 'OK',
          message: 'server running',
        })
        .code(200);
    },
  });

  await server.start();
  console.log(`server running at ${server.info.uri}`);
};

init();
