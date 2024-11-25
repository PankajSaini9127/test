const express = require('express');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Initialize the app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const cors = require('cors');
app.use(cors());

// const corsOptions = {
//   origin: '*', // Your React app's URL
//   methods: ['GET', 'POST'],
//   allowedHeaders: ['Content-Type'],
// };
// app.use(cors(corsOptions));


require('dotenv').config(); 
// Load environment variables

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Connected to MongoDB");
}).catch((error) => {
  console.error("Error connecting to MongoDB:", error.message);
});


// Define the schema for Users
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
  },
  { collection: 'skai_Lama_users' }
);

const User = mongoose.model('User', userSchema);




// Define the schema for Project
const projectSchema = new mongoose.Schema({
  username: { type: String, required: true },
  projectName: { type: String, required: true },
  files: { type: [String], default: [] }, 
},
{ collection: 'skai_Lama_users_Project' });

const Project = mongoose.model('Project', projectSchema);



// Multer setup for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Save file with unique name
  },
});

const upload = multer({ storage });

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Route to create a new project
app.post('/api/projects', upload.array('files', 5), async (req, res) => {
  try {
    const { username, projectName } = req.body;
    
    // If no files are uploaded, use an empty array
    const files = req.files ? req.files.map(file => file.path) : [];

    const newProject = new Project({
      username,
      projectName,
      files,
    });

    await newProject.save();
    res.status(201).json({ message: 'Project created successfully!', project: newProject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create project' });
  }
});

// API Route to get all projects for a user
app.get('/api/projects/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const projects = await Project.find({ username });

    if (!projects) {
      return res.status(404).json({ message: 'No projects found' });
    }

    res.status(200).json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve projects' });
  }
});


// API Route to check if a username exists
app.post('/api/login', async (req, res) => {
  console.log('Received Login request:', req.body);
    try {
      const { username } = req.body;
     
      const user = await User.findOne({ username });
  
      if (user) {
        return res.status(200).json({ message: 'Username found', usernameExists: true });
      } else {
        return res.status(200).json({ message: 'Username not found', usernameExists: false });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to check username' });
    }
  });
  



// API Route to register a new username
app.post('/api/register', async (req, res) => {
  console.log('Received Register request:', req.body);
  try {
    const { username } = req.body;

 
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const newUser = new User({ username });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error in register API:', error); // More detailed logging
    res.status(500).json({ message: 'Failed to register user' });
  }
});



// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
