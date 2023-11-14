// Import function triggers from their respective submodules:

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Importing necessary Node.js modules
const functions = require("firebase-functions"); // Provides the Cloud Functions functionality
const admin = require("firebase-admin"); // Allows interaction with Firebase from privileged environments
// Connecting firebase SDK to the API
var serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const bodyParser = require("body-parser");

const express = require("express"); // A web framework for Node.js to create API routes
const cors = require("cors"); // A package to enable CORS (Cross-Origin Resource Sharing)
const app = express(); // Creating an Express app instance
app.use(bodyParser.json()); // Use JSON parsing middleware
app.use(cors({ origin: true })); // Using CORS middleware to allow cross-origin requests

/* 
    Testing the root directory
    URL Example: https://us-central1-ragavaniauth.cloudfunctions.net/api
*/
app.get("/", (req, res) => {
  return res
    .status(200)
    .send("Testing RagaVani root directory APIs. Created by Wahid Rahimi");
});

// ------------------------------------------------- rgas collection --------------------------------------------------
/*
    POST endpoint to create a new raga
    URL Example: http://127.0.0.1:5001/ragavaniauth/us-central1/api/ragas
    JASON File Example passed to this API:
    {
        "category": "Melodic",
        "name": "Raga Bhairavi",
        "inputs": [1, 2, 3, 4, 5, 6, 7],
        "vadi": "Ma",
        "samvadi": "Sa",
        "description": "Raga Bhairavi is often referred to as the queen of ragas, usually performed in the concluding segment of a concert. It is a versatile raga that can express various emotions such as devotion, compassion, and sorrow."
    }
 */

app.post("/ragas", async (req, res) => {
  try {
    const raga = req.body;

    // Get a reference to the ragas collection and a new document reference
    const ragaCollection = admin.firestore().collection("ragas");
    const newRagaRef = ragaCollection.doc();

    // Add the new document ID as a field in the raga object
    raga.id = newRagaRef.id;

    // Set the raga document in Firestore
    await newRagaRef.set(raga);

    // Respond with the created raga object
    res.status(201).send(raga);
  } catch (error) {
    console.error("Error:", error);
    res.status(400).send(`Error: ${error}`);
  }
});

/*  API to add list of ragas POST endpoint to create multiple ragas in bulk
    URL Example: https://us-central1-ragavaniauth.cloudfunctions.net/api/ragas/list
    Jason File Passed to this API Example:
    [
      {
          "category": "Melodic",
          "name": "Raga Des",
          "inputs": [1, 2, 3, 4, 5, 6, 7],
          "vadi": "Pa",
          "samvadi": "Sa",
          "description": "Raga Des is a light and romantic raga often used in light classical forms, such as bhajans and thumris."
      },
      {
          "category": "Melodic",
          "name": "Raga Bihag",
          "inputs": [1, 2, 3, 4, 5, 6, 7],
          "vadi": "Ma",
          "samvadi": "Sa",
          "description": "Raga Bihag is a popular raga for late night and delivers a mood of romance and emotive depth."
      },
      {
          "category": "Melodic",
          "name": "Raga Kafi",
          "inputs": [1, 2, 3, 4, 5, 6, 7],
          "vadi": "Pa",
          "samvadi": "Sa",
          "description": "Raga Kafi is associated with the spring season and delivers a light and romantic mood."
      }
    ]
 */
app.post("/ragas/list", async (req, res) => {
  try {
    const ragas = req.body; // Extracting the ragas array from the request body
    const ragaCollection = admin.firestore().collection("ragas"); // Reference to the 'ragas' collection in Firestore
    const batch = admin.firestore().batch(); // Creating a batched write

    // Looping through each raga object in the provided array
    ragas.forEach((raga) => {
      // Creating a new document reference with an auto-generated ID
      const newRagaRef = ragaCollection.doc();
      // Adding the new raga to the batched write
      batch.set(newRagaRef, raga);
    });

    // Committing the batched writes to Firestore
    await batch.commit();

    // Sending back a response with status 201 (Created)
    res.status(201).send("Ragas added successfully");
  } catch (error) {
    // Handling errors and responding with status 400 (Bad Request) and error message
    res.status(400).send(`Error: ${error}`);
  }
});

/*  GET endpoint to retrieve a specific raga by ID
    URL Example:https://us-central1-ragavaniauth.cloudfunctions.net/api/ragas/z1Bbwb0xWITQr8BJ57KD
*/
app.get("/ragas/:id", async (req, res) => {
  try {
    // Fetching the raga document with the provided ID from the request parameters
    const raga = await admin
      .firestore()
      .collection("ragas")
      .doc(req.params.id)
      .get();
    if (!raga.exists) {
      // If the raga does not exist, responding with status 404 (Not Found)
      res.status(404).send("Raga not found");
    } else {
      // Responding with status 200 and the fetched raga object
      res.status(200).send({ id: raga.id, ...raga.data() });
    }
  } catch (error) {
    // Handling errors and responding with status 400 and error message
    res.status(400).send(`Error: ${error}`);
  }
});

/*  GET endpoint to retrieve all ragas
    URL: https://us-central1-ragavaniauth.cloudfunctions.net/api/ragas
*/
app.get("/ragas", async (req, res) => {
  try {
    const ragasCollection = admin.firestore().collection("ragas"); // Reference to the 'ragas' collection
    const snapshot = await ragasCollection.get(); // Fetching all documents from the collection
    const ragas = []; // Initializing an array to hold raga data
    snapshot.forEach((doc) => {
      // Pushing each document data along with its ID to the ragas array
      ragas.push({ id: doc.id, ...doc.data() });
    });
    // Responding with status 200 (OK) and the array of ragas
    res.status(200).send(ragas);
  } catch (error) {
    // Handling errors and responding with status 400 and error message
    res.status(400).send(`Error: ${error}`);
  }
});

/*  PATCH endpoint to update a raga by ID

    URL: https://us-central1-ragavaniauth.cloudfunctions.net/api/ragas/GCCbP43VbHbENdaEAoj9
    JASON Example:
    {
      "category": "Test Category",
      "description": "Updated from live API."
    }
 */
app.patch("/ragas/:id", async (req, res) => {
  try {
    const ragaId = req.params.id; // Extracting the raga ID from request parameters
    const updatedData = req.body; // Extracting the updated raga data from the request body
    const ragaRef = admin.firestore().collection("ragas").doc(ragaId); // Reference to the raga document to update

    // Checking if the raga with the provided ID exists
    const raga = await ragaRef.get();
    if (!raga.exists) {
      // Responding with status 404 (Not Found) if the raga does not exist
      res.status(404).send("Raga not found");
      return;
    }

    // Updating the raga document in Firestore
    await ragaRef.update(updatedData);
    // Sending back a response with status 200 (OK) and the updated raga data
    res.status(200).send({ id: ragaId, ...updatedData });
  } catch (error) {
    // Handling errors and responding with status 400 (Bad Request) and error message
    res.status(400).send(`Error: ${error}`);
  }
});

/*  DELETE endpoint to delete a raga by ID
     Delete Request to : https://us-central1-ragavaniauth.cloudfunctions.net/api/ragas/GCCbP43VbHbENdaEAoj9

*/
app.delete("/ragas/:id", async (req, res) => {
  try {
    const ragaId = req.params.id; // Extracting the raga ID from request parameters
    const ragaRef = admin.firestore().collection("ragas").doc(ragaId); // Reference to the raga document to delete

    // Checking if the raga with the provided ID exists
    const raga = await ragaRef.get();
    if (!raga.exists) {
      // Responding with status 404 (Not Found) if the raga does not exist
      res.status(404).send("Raga not found");
      return;
    }

    // Deleting the raga document from Firestore
    await ragaRef.delete();
    // Sending back a response with status 200 (OK) and a message confirming deletion
    res.status(200).send(`Raga with ID: ${ragaId} deleted successfully`);
  } catch (error) {
    // Handling errors and responding with status 400 (Bad Request) and error message
    res.status(400).send(`Error: ${error}`);
  }
});

// ------------------------------------------------- SignUp --------------------------------------------------

/*
    End point to sign up
  
    URL: https://us-central1-ragavaniauth.cloudfunctions.net/api/signup
    JASON File Example:
    {
        "email": "wahid@gmail.com",
        "password": "securePassword123",
        "firstName": "Wahid",
        "lastName": "Rahimi"
    }

    onces the user singed up a user profile/document will be created for the user under the users collection
    the user profile document will id same as that of the user id
 */
app.post("/signup", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });

    // Create user profile in Firestore
    await admin.firestore().collection("users").doc(userRecord.uid).set({
      user_id: userRecord.uid,
      email: email,
      first_name: firstName,
      last_name: lastName,
      date_created: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).send({ uid: userRecord.uid });
  } catch (error) {
    res.status(400).send(`Error: ${error.message}`);
  }
});

/* 
    API Endpoint to get a user based on their ID
    URL Example: https://us-central1-ragavaniauth.cloudfunctions.net/api/user/Nq4vF8niCBf0AFHcnwZO9rQDZYm2
*/
app.get("/user/:userId", async (req, res) => {
  try {
    // Extract userId from the request parameters
    const userId = req.params.userId;

    // Retrieve user data from Firestore using the extracted userId
    const userDocument = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();

    // Check if the document exists, if not, return a 404 status code
    if (!userDocument.exists) {
      res.status(404).send({ message: "User not found" });
      return;
    }

    // Send the retrieved user data as a response
    res.status(200).send(userDocument.data());
  } catch (error) {
    // If any error occurs, send a 500 status code with an error message
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

// ------------------------------------------------- Recording --------------------------------------------------

/**
 * POST endpoint to add a recording to a specified user's sub-collection "recordings".
 * Request Body should include: name(String), is_public(Boolean), and URL(String).
 * 
 *  URL Example: https://us-central1-ragavaniauth.cloudfunctions.net/api/user/zU8RUJx6kOgLO1gjpa8sGfJJ6Ut2/recording
 *  {
    "name": "My Recording",
    "is_public": true,
    "URL": "https://example.com/myrecording.mp3",
    "date_created": "2023-11-07T12:34:56Z",
    "duration": 120.5
  }
 */

app.post("/user/:userId/recording", async (req, res) => {
  try {
    // Extracting userId and recording details from the request
    const { userId } = req.params;
    const { name, is_public, URL, date_created, duration } = req.body;

    // Validate provided recording data
    if (
      !name ||
      typeof name !== "string" ||
      is_public === undefined ||
      typeof is_public !== "boolean" ||
      !URL ||
      typeof URL !== "string" ||
      !date_created ||
      typeof date_created !== "string" ||
      duration === undefined ||
      typeof duration !== "number"
    ) {
      res.status(400).send({ message: "Bad Request: Invalid input data" });
      return;
    }

    // Access the Firestore users collection
    const userDocRef = admin.firestore().collection("users").doc(userId);

    // Check for the existence of the user document
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      res.status(404).send({ message: "User not found" });
      return;
    }

    // Create a new recording in the "recordings" sub-collection
    const newRecordingDocRef = userDocRef.collection("recordings").doc();

    // Prepare the recording data,
    const recordingData = {
      id: newRecordingDocRef.id,
      userId, // Add the userId field
      name,
      is_public,
      URL,
      date_created, // Store the date_created as a string
      duration,
    };

    // Save the new recording data to Firestore
    await newRecordingDocRef.set(recordingData);

    // Respond with the saved recording data, including the generated ID
    res.status(201).send({
      message: "Recording added successfully",
      recording: recordingData, // Return the saved recording data
    });
  } catch (error) {
    // Handle any errors
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

/* 
    API endpoint to get all users' public recordings
    URL Example: https://us-central1-ragavaniauth.cloudfunctions.net/api/getAllUsersPublicRecordings

 */
app.get("/getAllUsersPublicRecordings", async (req, res) => {
  try {
    const usersCollection = admin.firestore().collection("users");
    const usersSnapshot = await usersCollection.get();
    const results = [];

    // Iterate through each user
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userPublicRecordings = [];
      const userFavoriteRagas = [];

      // Get user's public recordings
      const recordingsSnapshot = await usersCollection
        .doc(userDoc.id)
        .collection("recordings")
        .where("is_public", "==", true)
        .get();

      // Iterate through each public recording and add it to the userPublicRecordings array
      recordingsSnapshot.forEach((recordingDoc) => {
        const recordingData = recordingDoc.data();
        userPublicRecordings.push({
          id: recordingDoc.id,
          ...recordingData,
        });
      });

      // Get user's favorite ragas
      const ragasSnapshot = await usersCollection
        .doc(userDoc.id)
        .collection("favorite_ragas")
        .get();

      // Iterate through each favorite raga and add it to the userFavoriteRagas array
      ragasSnapshot.forEach((ragaDoc) => {
        const ragaData = ragaDoc.data();
        userFavoriteRagas.push({
          id: ragaDoc.id,
          ...ragaData,
        });
      });

      // Add the user, their public recordings, and their favorite ragas to results
      results.push({
        user: {
          id: userDoc.id,
          ...userData,
        },
        recordings: userPublicRecordings,
        favoriteRagas: userFavoriteRagas,
      });
    }

    // Send response with user data, their public recordings, and favorite ragas
    res.status(200).send(results);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send(`Internal Server Error: ${error}`);
  }
});

/*
  API end point to return all the users information along with the list of their public recording and
  list of favorite/created ragas. 
*/
app.get("/getUsers", async (req, res) => {
  try {
    const usersCollection = admin.firestore().collection("users");
    const usersSnapshot = await usersCollection.get();
    const results = [];

    // Iterate through each user
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userPublicRecordings = [];
      const userFavoriteRagas = [];

      // Fetch public recordings
      const recordingsSnapshot = await usersCollection
        .doc(userDoc.id)
        .collection("recordings")
        .where("is_public", "==", true)
        .get();

      // Add each public recording to userPublicRecordings array
      recordingsSnapshot.forEach((recordingDoc) => {
        userPublicRecordings.push({
          id: recordingDoc.id,
          ...recordingDoc.data(),
        });
      });

      // Fetch favorite ragas
      const favoriteRagasSnapshot = await usersCollection
        .doc(userDoc.id)
        .collection("favorite_ragas")
        .get();

      // Add each favorite raga to userFavoriteRagas array
      favoriteRagasSnapshot.forEach((ragaDoc) => {
        userFavoriteRagas.push({
          id: ragaDoc.id,
          ...ragaDoc.data(),
        });
      });

      // Add user, their public recordings, and favorite ragas to results
      results.push({
        user: {
          id: userDoc.id,
          ...userData,
        },
        recordings: userPublicRecordings,
        favoriteRagas: userFavoriteRagas,
      });
    }

    // Send response with user data, public recordings, and favorite ragas
    res.status(200).send(results);
  } catch (error) {
    // Handling errors and sending a response with status 500 (Internal Server Error) and error message
    console.error("Error:", error);
    res.status(500).send(`Internal Server Error: ${error}`);
  }
});

/*
    API endpoint to get all recordings (public and private) of a specific user.
    URL Example: https://us-central1-ragavaniauth.cloudfunctions.net/api/getAllMyRecordings/zxKAloMo2QUr0pnGupUYsBPPR382
    Returned JSON File format:
    
*/
app.get("/getAllMyRecordings/:userId", async (req, res) => {
  try {
    // Extracting userId from the path parameters
    const { userId } = req.params;

    // Reference to the user's recordings sub-collection in Firestore
    const recordingsRef = admin
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("recordings");

    // Querying for all recordings without applying any filtering condition
    const snapshot = await recordingsRef.get();

    if (snapshot.empty) {
      // No recordings found
      return res.status(404).send({ message: "No recordings found" });
    }

    // Building the response object
    const recordings = [];
    snapshot.forEach((doc) => {
      // Extract recording data
      const recordingData = doc.data();

      // Construct SavedRecording object including the id
      const savedRecording = {
        id: doc.id,
        name: recordingData.name,
        isPublic: recordingData.is_public,
        URL: recordingData.URL,
        // Assuming date_created is stored as a string, otherwise convert it to a string
        date_created: recordingData.date_created,
        duration: recordingData.duration,
      };

      recordings.push(savedRecording);
    });

    // Responding with status 200 (OK) and the recordings array
    return res.status(200).send(recordings);
  } catch (error) {
    // Handling errors and responding with status 500 (Internal Server Error) and error message
    console.error("Error fetching recordings:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
});

/*
    API endpoint to get a specific user's public recordings
    URL Example: https://us-central1-ragavaniauth.cloudfunctions.net/api/getMyPublicRecordings/Nq4vF8niCBf0AFHcnwZO9rQDZYm2
    Returned JASON File format
 */

app.get("/getMyPublicRecordings/:userId", async (req, res) => {
  try {
    // Extracting userId from the path parameters
    const { userId } = req.params;

    // Reference to the user's recordings sub-collection in Firestore
    const recordingsRef = admin
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("recordings");

    // Querying for all public recordings
    const snapshot = await recordingsRef.where("is_public", "==", true).get();

    if (snapshot.empty) {
      // No public recordings found
      return res.status(404).send({ message: "No public recordings found" });
    }

    // Building the response object
    const recordings = [];
    snapshot.forEach((doc) => {
      // Extract recording data
      const recordingData = doc.data();

      // Construct SavedRecording object including the id
      const savedRecording = {
        id: doc.id,
        name: recordingData.name,
        isPublic: recordingData.is_public,
        URL: recordingData.URL,
        // Assuming date_created is stored as a string, otherwise convert it to a string
        date_created: recordingData.date_created,
        duration: recordingData.duration,
      };

      recordings.push(savedRecording);
    });

    // Responding with status 200 (OK) and the recordings array
    return res.status(200).send(recordings);
  } catch (error) {
    // Handling errors and responding with status 500 (Internal Server Error) and error message
    console.error("Error fetching public recordings:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
});

/*
    API end point to get specific user's all private recordings
    URL Example: https://us-central1-ragavaniauth.cloudfunctions.net/api/getMyPrivateRecordings/Nq4vF8niCBf0AFHcnwZO9rQDZYm2
  Returned Jason file format:
 
*/
app.get("/getMyPrivateRecordings/:userId", async (req, res) => {
  try {
    // Extracting userId from the path parameters
    const { userId } = req.params;

    // Reference to the user's recordings sub-collection in Firestore
    const recordingsRef = admin
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("recordings");

    // Querying for all private recordings (where is_public is false)
    const snapshot = await recordingsRef.where("is_public", "==", false).get();

    if (snapshot.empty) {
      // No private recordings found
      return res.status(404).send({ message: "No private recordings found" });
    }

    // Building the response object
    const recordings = [];
    snapshot.forEach((doc) => {
      // Constructing each recording's data, including the new fields
      const recordingData = doc.data();

      const savedRecording = {
        id: doc.id,
        name: recordingData.name,
        isPublic: recordingData.is_public,
        URL: recordingData.URL,
        date_created: recordingData.date_created, // Stored as a string
        duration: recordingData.duration,
      };

      recordings.push(savedRecording);
    });

    // Responding with status 200 (OK) and the recordings array
    return res.status(200).send(recordings);
  } catch (error) {
    // Handling errors and responding with status 500 (Internal Server Error) and error message
    console.error("Error fetching private recordings:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
});

// ------------------------------------------------- favorite_ragas / created ragas --------------------------------------------------

/*  POST endpoint to add a favorite raga for a specific user
    URL Example: https://us-central1-ragavaniauth.cloudfunctions.net/api/user/zU8RUJx6kOgLO1gjpa8sGfJJ6Ut2/favorite_raga
    JASON FILE Example Passed to this end point:
    {
        "category": "Melodic3",
        "name": "Raga Bhairavi",
        "inputs": [1, 2, 3, 4, 5, 6, 7],
        "vadi": "Ma",
        "samvadi": "Sa",
        "description": "Raga Bhairavi is often referred to as the queen of ragas...",
        "is_public": ture
    }
 */

app.post("/user/:userId/favorite_raga", async (req, res) => {
  try {
    // Extracting user ID from the URL parameter and raga object from request body
    const { userId } = req.params;
    let { name, category, inputs, vadi, samvadi, description, is_public } =
      req.body;

    // Validations: Ensure raga object has essential properties
    if (!name || !category || !inputs || is_public === undefined) {
      return res.status(400).send("Error: Missing essential raga properties.");
    }

    // Reference to the 'users' collection and specific user document in Firestore
    const userDocRef = admin.firestore().collection("users").doc(userId);

    // Check if user exists
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return res.status(404).send("Error: User not found.");
    }

    // Reference to 'favorite_ragas' sub-collection for the specified user
    const favoriteRagaCollection = userDocRef.collection("favorite_ragas");

    // Generating a new DocumentReference for our new raga
    const newRagaRef = favoriteRagaCollection.doc();

    // Constructing raga data including userId and is_public
    const ragaData = {
      id: newRagaRef.id,
      userId,
      name,
      category,
      inputs,
      vadi,
      samvadi,
      description,
      is_public,
    };

    // Saving the raga data to the new document reference
    await newRagaRef.set(ragaData);

    // Responding with the created raga object
    res
      .status(201)
      .send({ message: "Raga added successfully", raga: ragaData });
  } catch (error) {
    // Handling errors and responding with status 400 (Bad Request) and error message
    res.status(400).send(`Error: ${error}`);
  }
});

/*
    API Endpoint to get all favorite ragas for a specific user
    URL example: https://us-central1-ragavaniauth.cloudfunctions.net/api/user/UAWYZr8PMuMeuq0wL8pMMUNnwMt2/favorite_ragas
*/
app.get("/user/:userId/favorite_ragas", async (req, res) => {
  try {
    const { userId } = req.params; // Extracting userId from request parameters

    if (!userId) {
      // Sending a response with status 400 (Bad Request) if userId is not provided
      return res.status(400).send("User ID must be provided");
    }

    const favoriteRagasCollection = admin
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("favorite_ragas");

    const ragasSnapshot = await favoriteRagasCollection.get();

    if (ragasSnapshot.empty) {
      // Sending a response with status 404 (Not Found) if no favorite ragas found
      return res
        .status(404)
        .send("No favorite ragas found for the specified user");
    }

    const favoriteRagas = [];

    // Iterating through each document in the ragasSnapshot and adding to the favoriteRagas array
    ragasSnapshot.forEach((doc) => {
      favoriteRagas.push({ id: doc.id, ...doc.data() });
    });

    // Sending back a response with status 200 (OK) and the favorite ragas
    res.status(200).send(favoriteRagas);
  } catch (error) {
    // Handling errors and sending a response with status 500 (Internal Server Error) and error message
    console.error("Error:", error);
    res.status(500).send(`Internal Server Error: ${error}`);
  }
});

/* 
    API Endpoint to add a raga to user's favorite_ragas
    this API takes a ragaId from ragas collection and if that ragaId existed it will add the raga to the 
    user's (with given userId in the users collection) favorite_ragas sub-collection which is under users collection
    URL Example: https://us-central1-ragavaniauth.cloudfunctions.net/api/add_raga_from_ragas_to_user_favorite_raga
    Example of JSON file to be posted using POST method:
    {
      "userId": "zU8RUJx6kOgLO1gjpa8sGfJJ6Ut2",
      "ragaId": "zf8N6uI3eBPX4cwcZE87"
    } 
 */
app.post("/add_raga_from_ragas_to_user_favorite_raga", async (req, res) => {
  try {
    const { userId, ragaId } = req.body; // Extracting userId and ragaId from request body

    if (!userId || !ragaId) {
      // Sending a response with status 400 (Bad Request) if userId or ragaId is not provided
      return res.status(400).send("User ID and Raga ID must be provided");
    }

    // Fetching raga from "ragas" collection
    const ragaRef = admin.firestore().collection("ragas").doc(ragaId);
    const ragaSnap = await ragaRef.get();

    if (!ragaSnap.exists) {
      // Sending a response with status 404 (Not Found) if raga doesn't exist
      return res.status(404).send("Raga not found");
    }

    // Fetching user from "users" collection
    const userRef = admin.firestore().collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      // Sending a response with status 404 (Not Found) if user doesn't exist
      return res.status(404).send("User not found");
    }

    // Adding raga to user's "favorite_ragas" sub-collection
    await userRef.collection("favorite_ragas").doc(ragaId).set(ragaSnap.data());

    // Sending back a response with status 201 (Created) and a confirmation message
    res.status(201).send(`Raga ${ragaId} added to ${userId}'s favorite ragas`);
  } catch (error) {
    // Handling errors and sending a response with status 500 (Internal Server Error) and error message
    console.error("Error:", error);
    res.status(500).send(`Internal Server Error: ${error}`);
  }
});

/*
  Delete a raga from user's "favorite_ragas" sub collection
*/
app.delete("/user/:userId/favorite_raga/:ragaId", async (req, res) => {
  try {
    // Extracting user ID and raga ID from the URL parameters
    const { userId, ragaId } = req.params;

    // Reference to the 'users' collection and specific user document in Firestore
    const userDocRef = admin.firestore().collection("users").doc(userId);

    // Check if user exists
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return res.status(404).send("Error: User not found.");
    }

    // Reference to the 'favorite_ragas' sub-collection and specific raga document for the specified user
    const ragaDocRef = userDocRef.collection("favorite_ragas").doc(ragaId);

    // Check if raga exists
    const ragaDoc = await ragaDocRef.get();
    if (!ragaDoc.exists) {
      return res.status(404).send("Error: Raga not found.");
    }

    // Delete the specified raga document
    await ragaDocRef.delete();

    // Responding with a success message
    res
      .status(200)
      .send(
        `Raga with ID ${ragaId} successfully deleted from user ${userId}'s favorites.`
      );
  } catch (error) {
    // Handling errors and responding with status 400 (Bad Request) and error message
    res.status(400).send(`Error: ${error}`);
  }
});

// ------------------------------------------------- favorite_raga_from_ragas / saved ragas --------------------------------------------------

/*
  API to add a raga from raga database to the user's profile under the favorite_raga_from_ragas sub collection
  it will store a reference or ragaId to the favorite_raga_from_ragas
  URL: https://us-central1-ragavaniauth.cloudfunctions.net/api/user/4Ttv7vL2LoaMIvxGVrB5uvWz01t2/favorite_raga_from_ragas/2H2kwuYXl3dY78gh9Obp
 */

app.post("/user/:userId/favorite_raga_from_ragas/:destId/:ragaId", async (req, res) => {
  try {
    const { userId, ragaId } = req.params;

    if (!userId || !ragaId) {
      return res.status(400).send("Both User ID and Raga ID must be provided");
    }

    const userDocRef = admin.firestore().collection("users").doc(userId);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return res.status(404).send("Error: User not found.");
    }

    if (destId == "Raga DB") {
      // get reference to raga database
      const ragaRef = admin.firestore().collection("ragas").doc(ragaId);
      const ragaSnapshot = await ragaRef.get();
      if (!ragaSnapshot.exists) {
        return res.status(404).send("Raga not found");
      }
  
      const userFavoriteRagasRef = userDocRef.collection(
        "favorite_ragas_from_ragas"
      );
      const newFavoriteRagaRef = userFavoriteRagasRef.doc(); // Create a new document reference
  
      // Prepare data to be added
      const favoriteRagaData = {
        id: newFavoriteRagaRef.id, // ID of the new document
        ragaReference: ragaRef, // Reference to the raga document
      };

      // Add the data to Firestore
      await newFavoriteRagaRef.set(favoriteRagaData);
    }
    else {
      // get reference to user want to save raga from
      const destUserRef = admin.firestore().collection("users").doc(destId);
      const destUserSnapshot = await destUserRef.get();
      
      if (!destUserSnapshot.exists) {
        return res.status(404).send("Dest User not found");
      }

      // get reference to favorites collection of dest user
      const destRagaFavoriteRef = destUserRef.collection("favorite_ragas");
      const destTagaFavoriteSnapshot = await destRagaFavoriteRef.get();

      if (!destTagaFavoriteSnapshot.exists) {
        return res.status(404).send("Dest Favorite not found");
      }

      // check raga in user favorites (created) collection
      const ragaRef = destRagaFavoriteRef.doc(ragaId);
      const ragaSnapshot = await ragaRef.get();
      
      if (!ragaSnapshot.exists) {
        return res.status(404).send("Dest raga not found");
      }

      const userFavoriteRagasRef = userDocRef.collection(
        "favorite_ragas_from_ragas"
      );
      
      const newFavoriteRagaRef = userFavoriteRagasRef.doc(); // Create a new document reference

      // Prepare data to be added
      const favoriteRagaData = {
        id: newFavoriteRagaRef.id, // ID of the new document
        ragaReference: ragaRef, // Reference to the raga document
      };

      // Add the data to Firestore
      await newFavoriteRagaRef.set(favoriteRagaData);
    }
    
    res.status(200).send(`Raga with ID: ${ragaId} added to user's favorites`);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send(`Internal Server Error: ${error}`);
  }
});

/*
    API to get a user's favoirite raga from favorite_ragas_from_ragas sub collection 
    favorite_ragas_from_ragas store IDs of ragas from ragas collection
*/
app.get("/user/:userId/favorite_ragas_from_ragas", async (req, res) => {
  try {
    const { userId } = req.params;

    // Reference to the user's favorite_ragas_from_ragas sub-collection
    const userFavoriteRagasRef = admin
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("favorite_ragas_from_ragas");

    // Fetch the raga references for the user
    const favoriteRagasSnapshots = await userFavoriteRagasRef.get();

    // If no favorite ragas found, return empty array
    if (favoriteRagasSnapshots.empty) {
      return res.status(200).json([]);
    }

    // Prepare an array to hold the promises for fetching each raga's details
    const ragaFetchPromises = [];

    // For each favorite raga reference, prepare a promise to fetch its details
    favoriteRagasSnapshots.forEach((doc) => {
      const ragaRef = doc.data().ragaReference;
      ragaFetchPromises.push(ragaRef.get());
    });

    // Resolve all promises to fetch the raga details
    const ragaDetailsSnapshots = await Promise.all(ragaFetchPromises);

    // Extract the actual data from the snapshots and prepare the response array
    const favoriteRagas = ragaDetailsSnapshots.map((snapshot) =>
      snapshot.data()
    );

    // Return the array of favorite ragas to the client
    res.status(200).json(favoriteRagas);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send(`Internal Server Error: ${error}`);
  }
});

/*
  API endpoint to delete a ragaId/ reference from the user's favorite_ragas_from_ragas sub collection
*/

app.delete(
  "/user/:userId/favorite_ragas_from_ragas/:ragaId",
  async (req, res) => {
    try {
      const { userId, ragaId } = req.params;

      // Reference to the user's favorite_ragas_from_ragas sub-collection
      const userFavoriteRagasRef = admin
        .firestore()
        .collection("users")
        .doc(userId)
        .collection("favorite_ragas_from_ragas");

      // Query the sub-collection to find the document with the specified raga reference
      const favoriteRagaQuery = userFavoriteRagasRef.where(
        "ragaReference",
        "==",
        admin.firestore().collection("ragas").doc(ragaId)
      );
      const querySnapshot = await favoriteRagaQuery.get();

      // If no such document is found, respond accordingly
      if (querySnapshot.empty) {
        return res
          .status(404)
          .send(`Raga with ID: ${ragaId} not found in user's favorites.`);
      }

      // If the document is found, delete it
      const doc = querySnapshot.docs[0]; // We're taking the first result since ragaId should be unique and we expect only one match
      await doc.ref.delete();

      // Respond to the client indicating successful deletion
      res
        .status(200)
        .send(`Raga with ID: ${ragaId} removed from user's favorites.`);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send(`Internal Server Error: ${error}`);
    }
  }
);

// ------------------------------------------------- Version --------------------------------------------------

// add a version document
/*
  {
  "name": "users",
  "version": "1.0.1"
}

 */
app.post("/versions", async (req, res) => {
  try {
    // Extracting collection name and version from the request body
    const { name, version } = req.body;

    // Basic validation
    if (!name || !version) {
      return res.status(400).send("Both name and version must be provided");
    }

    // Reference to the 'versions' collection
    const versionsRef = admin.firestore().collection("versions");

    // Generate a new document reference
    const newVersionDocRef = versionsRef.doc();

    // Set the details in the new document
    await newVersionDocRef.set({
      id: newVersionDocRef.id,
      name: name,
      version: version,
    });

    res
      .status(200)
      .send(
        `Version for collection ${name} added with ID: ${newVersionDocRef.id}`
      );
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send(`Internal Server Error: ${error}`);
  }
});

// API to get collection versions
/*
  [
    {
        "id": "WVbU6l21Q5xrcXuzzzxc",
        "name": "users",
        "version": "1.0.1"
    },
    {
        "id": "zi0kPHKzv5mYizpiRoQq",
        "name": "users",
        "version": "1.0.1"
    }
]
 */
app.get("/versions/:collection_name", async (req, res) => {
  try {
    const { collection_name } = req.params;

    // Validate the input
    if (!collection_name) {
      return res.status(400).send("Collection name must be provided");
    }

    // Reference to the 'versions' collection
    const versionsRef = admin.firestore().collection("versions");

    // Query the collection to find all documents with the matching collection name
    const querySnapshot = await versionsRef
      .where("name", "==", collection_name)
      .get();

    // Check if there are any matching documents
    if (querySnapshot.empty) {
      return res
        .status(404)
        .send("No versions found for the specified collection name");
    }

    // Extract the necessary data from the documents
    const responseData = [];
    querySnapshot.forEach((doc) => {
      const docData = doc.data();
      responseData.push({
        id: doc.id,
        name: docData.name,
        version: docData.version,
      });
    });

    // Send the response back as JSON
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send(`Internal Server Error: ${error}`);
  }
});

// ------------------------------------------------- Presets --------------------------------------------------

app.post("/user/:userId/presets", async (req, res) => {
  try {
    // Extracting user ID from the URL parameter and preset object from request body
    const { userId } = req.params;
    const preset = req.body;

    // Validations: Ensure preset object has essential properties
    if (!preset.name || !preset.pitch) {
      return res
        .status(400)
        .send("Error: Missing essential preset properties.");
    }

    // Reference to the 'users' collection and specific user document in Firestore
    const userDocRef = admin.firestore().collection("users").doc(userId);

    // Check if user exists
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return res.status(404).send("Error: User not found.");
    }

    // Reference to 'preset' sub-collection for the specified user
    const presetCollection = userDocRef.collection("presets");

    // Generating a new DocumentReference for our new preset
    const newPresetRef = presetCollection.doc();

    // Adding the new document ID as a field in the preset object
    preset.id = newPresetRef.id;

    // Saving the preset data to the new document reference
    await newPresetRef.set(preset);

    // Responding with the created preset object
    res.status(201).send(preset);
  } catch (error) {
    // Handling errors and responding with status 400 (Bad Request) and error message
    res.status(400).send(`Error: ${error}`);
  }
});

app.delete("/user/:userId/presets/:presetId", async (req, res) => {
  try {
    // Extracting user ID and raga ID from the URL parameters
    const { userId, presetId } = req.params;

    // Reference to the 'users' collection and specific user document in Firestore
    const userDocRef = admin.firestore().collection("users").doc(userId);

    // Check if user exists
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return res.status(404).send("Error: User not found.");
    }

    // Reference to the 'preset' sub-collection and specific raga document for the specified user
    const presetDocRef = userDocRef.collection("presets").doc(presetId);

    // Check if raga exists
    const presetDoc = await presetDocRef.get();
    if (!presetDoc.exists) {
      return res.status(404).send("Error: Raga not found.");
    }

    // Delete the specified preset document
    await presetDocRef.delete();

    // Responding with a success message
    res
      .status(200)
      .send(
        `Preset with ID ${presetId} successfully deleted from user ${userId}'s presets.`
      );
  } catch (error) {
    // Handling errors and responding with status 400 (Bad Request) and error message
    res.status(400).send(`Error: ${error}`);
  }
});

app.get("/user/:userId/presets", async (req, res) => {
  try {
    const { userId } = req.params; // Extracting userId from request parameters

    if (!userId) {
      // Sending a response with status 400 (Bad Request) if userId is not provided
      return res.status(400).send("User ID must be provided");
    }

    const presetCollection = admin
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("presets");

    const presetSnapshot = await presetCollection.get();

    if (presetSnapshot.empty) {
      // Sending a response with status 404 (Not Found) if no favorite ragas found
      return res.status(404).send("No presets found for the specified user");
    }

    const presets = [];

    // Iterating through each document in the ragasSnapshot and adding to the favoriteRagas array
    presetSnapshot.forEach((doc) => {
      presets.push({ id: doc.id, ...doc.data() });
    });

    // Sending back a response with status 200 (OK) and the favorite ragas
    res.status(200).send(presets);
  } catch (error) {
    // Handling errors and sending a response with status 500 (Internal Server Error) and error message
    console.error("Error:", error);
    res.status(500).send(`Internal Server Error: ${error}`);
  }
});

// exports the APIs to the firestore database
exports.api = functions.https.onRequest(app);
