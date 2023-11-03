let express = require("express");
let app = express();

let Mongo = require("mongodb");
let { MongoClient } = require("mongodb");
let MONGO_URL = "mongodb://127.0.0.1:27017";
const client = new MongoClient(MONGO_URL);
async function main() {
  await client.connect();
}
const collection = client.db("internfeb").collection("dashboard");

let cors = require("cors");
const port = process.env.PORT || 7710;

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const package = require("./package.json");

swaggerDocument.info.version = package.version;
app.use("/api-doc", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.get("/health", (req, res) => {
  res.send("Health OK");
});

// insert user
app.post("/addUser", async (req, res) => {
  await collection.insertOne(req.body);
  res.send("Data Added");
});

// get users
app.get("/users", async (req, res) => {
  const output = [];
  let query = {};
  if (req.query.city) {
    query = { city: req.query.city, isActive: true };
  } else if (req.query.role) {
    query = { role: req.query.role, isActive: true };
  } else if (req.query.role && req.query.city) {
    query = { role: req.query.role, city: req.query.city, isActive: true };
  } else if (req.query.isActive) {
    let isActive = req.query.isActive;
    isActive = isActive == "false" ? false : true;
    query = { isActive };
  } else {
    query = { isActive: true };
  }
  const cursor = collection.find(query);
  for await (const data of cursor) {
    output.push(data);
  }
  cursor.closed;
  res.send(output);
});

// get particular user
app.get("/user/:id/", async (req, res) => {
  const output = [];
  const query = { _id: new Mongo.ObjectId(req.params.id) };
  const cursor = collection.find(query);
  for await (const data of cursor) {
    output.push(data);
  }
  cursor.closed;
  res.send(output);
});

// update particular user
app.put("/user/:id/", async (req, res) => {
  await collection.updateOne(
    { _id: new Mongo.ObjectId(req.params.id) },
    {
      $set: {
        name: req.body.name,
        city: req.body.city,
        phone: req.body.phone,
        role: req.body.role,
        isActive: req.body.isActive == "false" ? false : true,
      },
    }
  );
  res.send("Record Updated");
});

// Delete Particular User
app.delete("/deleteUser", async (req, res) => {
  await collection.deleteOne({
    _id: new Mongo.ObjectId(req.body.id),
  });
  res.send("User Deleted");
});

// softDelete User
app.put("/deactivateUser", async (req, res) => {
  await collection.updateOne(
    { _id: new Mongo.ObjectId(req.body._id) },
    {
      $set: {
        isActive: false,
      },
    }
  );
  res.send("User Deactivate");
});

//regain softDelete User
app.put("/activateUser", async (req, res) => {
  await collection.updateOne(
    { _id: new Mongo.ObjectId(req.body._id) },
    {
      $set: {
        isActive: true,
      },
    }
  );
  res.send("User Activate");
});

app.listen(port, () => {
  main();
  console.log(`Running on --> http://localhost:${port}`);
});
