require('dotenv').config()
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 3000;


const app = express();
// Aroggo
// hPfuji8LlzXMvofn


app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.1k8uoge.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    // collections
    const usersCollection = client.db("Aroggo").collection("users");








    // * users
    app.post("/users" ,async(req,res)=>{
      const email = req.body.email;

      const userExit = await usersCollection.findOne({email});
      if(userExit){
        return res.status(409).send({message: "User already exits" , inserted: false});
      }

      const userInfo = req.body;

      const result = await usersCollection.insertOne(userInfo);
      res.send(result);
    });
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  }
  finally {
  }
}
run().catch(console.dir);


app.get("/", (req, res) => {
  res.send("Aroggo server is running");
});

app.listen(port, () => {
  console.log(`Aroggo server is running on port,${port}`);
});
