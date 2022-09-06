const jsonServer = require("json-server");
const auth = require("json-server-auth");

const middlewares = jsonServer.defaults();

const app = jsonServer.create();
// Set default middlewares (logger, static, cors and no-cache)
app.use(middlewares);

const router = jsonServer.router("db.json");

function getUser(user) {
  const db = require("./db.json");
  delete user.password;
  const foundUser = db.users.find((v) => v.id == user.id);
  return { ...foundUser, ...user };
}

// /!\ Bind the router db to the app
app.db = router.db;

const rules = auth.rewriter({
  // Permission rules
  "api/users": 660,
  // "api/ideas": 664,
});

// You must apply the middlewares in the following order
app.use(rules);

// You must apply the auth middleware before the router
app.use(auth);

app.use((req, res, next) => {
  const body = req.body;
  if (req.method === "POST") {
    body.createdAt = Date.now();
    body.updatedAt = Date.now();
  } else if (req.method === "PATCH" || req.method === "PUT") {
    body.updatedAt = Date.now();
    if (req.url.includes("/users/")) {
      const id = req.url.match(/\d+/g)[0];
      req.body = getUser({ ...body, id });
    }
  }
  // Continue to JSON Server router
  next();
});

router.render = (req, res) => {
  const data = res.locals.data || {};
  if (
    req.method === "PATCH" ||
    (req.method === "PUT" && req.url.includes("/users/"))
  ) {
    delete data.password;
  }
  res.jsonp(data);
};

app.use("/api", router);

app.listen(3005, () => {
  console.log("JSON Server is running at http://localhost:3005");
});
