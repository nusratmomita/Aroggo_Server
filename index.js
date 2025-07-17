require('dotenv').config()
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 3000;


const app = express();
// Aroggo
// hPfuji8LlzXMvofn


app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const medicineCollection = client.db("Aroggo").collection("medicines");
    const adCollection = client.db("Aroggo").collection("ads");
    const cartCollection = client.db("Aroggo").collection("myCart");








    // * users
    // to create a user that is unique in the system
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























    // * medicine
    // to get medicines added by a specific seller 
    app.get("/medicines/email" , async(req,res)=>{
      try {
        const email = req.query.email;

        if (!email) {
          return res.status(400).send({ message: "Email is required" });
        }

        const userMedicines = await medicineCollection
          .find({ sellerEmail: email })
          .toArray();

        res.send(userMedicines);
      } 
      catch (error) {
        console.error("Failed to fetch user medicines:", error);
        res.status(500).send({ message: "Server error" });
      }
    });

    // to get category wise medicines
    app.get("/category", async (req, res) => {
      try {
        const result = await medicineCollection.aggregate([
          {
            $group: {
              _id: "$category",
              image: { $first: "$image" },
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 8 }
        ]).toArray();

        const categoryCards = result.map(cat => ({
          categoryName: cat._id,
          categoryImage: cat.image,
          count: cat.count
        }));
        res.status(200).send(categoryCards);
      } 
      catch (error) {
        console.error("Failed to fetch category cards:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    // to get medicines for a specific category
    app.get("/category/medicines" , async(req,res)=>{
      try {
        const category = req.query.category;

        if (!category) {
          return res.status(400).send({ message: "Category is required" });
        }

        const medicines = await medicineCollection
          .find({ category: { $regex: `^${category}$`, $options: "i" } })
          .sort({ added_at: -1 }) 
          .toArray();

        res.status(200).send(medicines);
      } catch (error) {
        console.error("Failed to fetch medicines by category:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    })

    // to add a new medicine
    app.post("/medicines" , async(req,res)=>{
      const medicineInfo = req.body;

      const result = await medicineCollection.insertOne(medicineInfo);
      res.send(result);
    });









    // * my cart
    // to get cart items for a specific user
    app.get("/myCart" , async(req,res)=>{
      try {
        const { email } = req.query;
        if (!email) return res.status(400).send({ message: "Email is required" });

        const items = await cartCollection.find({ email }).toArray();
        res.status(200).send(items);
      } catch (error) {
        console.error("Fetch cart failed:", error);
        res.status(500).send({ message: "Server error" });
      }
    });

    // to add a new item to the cart
    app.post("/myCart" , async(req,res)=>{
      try{
        const {email , medicineId , name , company , price , quantity=1} = req.body;

        if (!email || !medicineId) {
          return res.status(400).send({ message: "Email and medicine ID are required" });
        }

        const alreadyExists = await cartCollection.findOne({email,medicineId});

        if(alreadyExists){
          return res.status(409).send({ message: "Already in cart" });
        }

        const addToCart = await cartCollection.insertOne({
          email,
          medicineId,
          name,
          company,
          price,
          quantity,
          added_at: new Date().toISOString()
        });
        console.log(addToCart);

        res.send(addToCart);
      }
      catch (error) {
        console.error("Add to cart failed:", error);
        res.status(500).send({ message: "Server error" });
      }
    });

    // to increment/decrement the cart items
    app.patch("/myCart/ChangeQuantity/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { change } = req.body; // change +1 or -1

        const result = await cartCollection.updateOne(
          { _id: new ObjectId(id) },
          { $inc: { quantity: change } }
        );

        res.send(result);
      } catch (error) {
        console.error("Failed to update quantity:", error);
        res.status(500).send({ message: "Server error" });
      }
    }); 

    // to remove a single item from cart
    // app.delete("/myCart/:id", async (req, res) => {
    //   try {
    //     const id = req.params.id;
    //     const result = await cartCollection.deleteOne({ _id: new ObjectId(id) });

    //     res.send(result);
    //   } catch (error) {
    //     console.error("Failed to delete cart item:", error);
    //     res.status(500).send({ message: "Server error" });
    //   }
    // });

    // // to clear everything from the cart
    //  app.delete("/myCart/remove", async (req, res) => {
    //   try {
    //     const { email } = req.query;
    //     if (!email) return res.status(400).send({ message: "Email is required" });

    //     const result = await cartCollection.deleteMany({ email });
    //     res.send(result);
    //   } catch (error) {
    //     console.error("Failed to clear cart:", error);
    //     res.status(500).send({ message: "Server error" });
    //   }
    // });







    // * ads

    // to get ads per email
    app.get("/adRequest/email", async (req, res) => {
      try {
        const email = req.query.email;

        if (!email) {
          return res.status(400).send({ message: "Email is required" });
        }

        const sellerAds = await adCollection
          .find({ sellerEmail: email })
          .sort({ requestedAt: -1 })
          .toArray();

        res.status(200).send(sellerAds);
      } catch (error) {
        console.error("Failed to fetch ad requests by email:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    // to create ads
    app.post("/adRequest" , async(req,res)=>{
      try {
        const adRequest = req.body;

        // Set default fields
        adRequest.status = "Pending";
        adRequest.requestedAt = new Date().toISOString();

        const result = await adCollection.insertOne(adRequest);

        res.status(201).send({
          message: "Ad request submitted successfully",
          insertedId: result.insertedId
        });
      } 
      catch (error) {
        console.error("Ad request submission failed:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
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
