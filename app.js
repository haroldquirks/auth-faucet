"use strict";

// 3rd party
const koa = require("koa");
const bouncer = require("koa-bouncer");
const session = require("koa-session");

const config = require("./config");

const app = koa();

// session key
app.keys = ["a dummy key"];
app.use(require("koa-body")({ multipart: true }));
app.use(session(app));
app.use(bouncer.middleware());



// routes
app.use(require("./route").routes());

// run server
app.listen(config.PORT, function() {
  console.log("Listening on port", config.PORT);
});
