const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");  
const { MongoClient, ObjectId } = require("mongodb");

const url = "mongodb://localhost:27017";
const dbName = "React_Project";
const client = new MongoClient(url);

const app = express();

app.use(bodyParser.json());
app.use(cors());  

let db;
async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db(dbName);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
}

connectToDatabase();

const usersCollection = () => db.collection("users");

// Signup endpoint
app.post("/signup", async (req, res) => {
  console.log("Signup endpoint called");

  const { username, email, password, city, role } = req.body;

  const existingUser = await usersCollection().findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, errors: "Email already exists!" });
  }

  const newUser = { username, email, password, city, role };
  const result = await usersCollection().insertOne(newUser);

  const userId = result.insertedId;

  res.status(201).json({ 
    success: true, 
    _id: userId, 
    username 
  });
});

// Login endpoint
app.post("/login", async (req, res) => {
  console.log("Login endpoint called");

  const { email, password } = req.body;

  try {
    const user = await usersCollection().findOne({ email });

    if (user && user.password === password) {
      res.status(200).json({ 
        success: true, 
        _id: user._id, 
        username: user.username, 
        message: "Login successful" 
      });
    } else {
      res.status(400).json({ success: false, errors: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, errors: "Internal Server Error" });
  }
});

// Get all modules
app.get("/modules", async (req, res) => {
  try {
    const modules = await db.collection("modules").find().toArray();
    res.status(200).json(modules);
  } catch (error) {
    console.error("Failed to fetch modules:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const modulesCollection = () => db.collection("modules");
const achievementsCollection = () => db.collection("achievements");

// Route to handle adding a topic to the achievements collection
app.post("/achievements", async (req, res) => {
  const { userId, moduleName, topic } = req.body;

  try {
    const existingAchievement = await achievementsCollection().findOne({
      userId,
      moduleName,
      topic,
    });

    if (existingAchievement) {
      return res.status(400).json({ success: false, message: "Topic already completed" });
    }

    const newAchievement = {
      userId,
      moduleName,
      topic,
      completedAt: new Date(),
    };

    await achievementsCollection().insertOne(newAchievement);
    res.status(200).json({ success: true, message: "Topic added to achievements" });
  } catch (err) {
    console.error("Failed to add achievement:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});
// Route to get achievements for a user
app.get("/achievements/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const achievements = await achievementsCollection().find({ userId }).toArray();
    res.status(200).json(achievements);
  } catch (err) {
    console.error("Failed to retrieve achievements:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
