
const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('./config');



const app = express();
const PORT = process.env.PORT || 3000;
const jwtSecretKey = process.env.JWT_SECRET || 'qwertyuiopasdfghjklzxcvbnm123456';
const options = { maxTimeMS: 10000 };

// Middleware
app.use(express.json());
app.use(cors());

const User = require('./model/user');

// Connect to MongoDB
const client = new MongoClient(config.mongoURI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("test").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    }).then(() => {
      console.log('Connected to MongoDB');
    }).catch((error) => {
      console.error('Error connecting to MongoDB:', error.message);
    });
    

  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);


// User Model



//Allow all requests from all domains & localhost
app.all('/*', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "POST, GET");
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
  next();
});


// Routes
// Create a user
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().maxTimeMS(10000);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

});

// Fetch a user
app.get('/api/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a user
app.put('/api/users/:userId', async (req, res) => {
  try {
    const { name, email } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { name, email, updated: Date.now() },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a user
app.delete('/api/users/:userId', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.userId);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


const generateToken = (userId) => {
  return jwt.sign({ userId }, jwtSecretKey, { expiresIn: '1h' }); // Token expires in 1 hour
};

// User Sign-in
app.post('/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id); // Generate JWT token
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// User Sign-out
app.get('/auth/signout', async (req, res) => {
  try {

    res.json({ message: 'Sign-out successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Welcome message
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to DressStore application' });
});

// Run the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// test();