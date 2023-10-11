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

/**
 * POST endpoint to add a recording to a specified user's sub-collection "recordings".
 * Request Body should include: name(String), is_public(Boolean), and URL(String).
 * 
 *  URL Example: https://us-central1-ragavaniauth.cloudfunctions.net/api/user/zU8RUJx6kOgLO1gjpa8sGfJJ6Ut2/recording
 *  JASON file Example:
 *  {
      "name": "My Recording 4",
      "is_public": true,
      "URL": "https://example.com/recording4.mp3"
    }
 */
app.post("/user/:userId/recording", async (req, res) => {
  try {
    // Extracting userId from the request parameters
    const userId = req.params.userId;

    // Extracting recording data from the request body
    const { name, is_public, URL } = req.body;

    // Validate data: Ensure all data is provided and is of correct type
    if (
      !name ||
      typeof name !== "string" ||
      is_public === undefined ||
      typeof is_public !== "boolean" ||
      !URL ||
      typeof URL !== "string"
    ) {
      res.status(400).send({ message: "Bad Request: Invalid input data" });
      return;
    }

    // Retrieve user's document reference
    const userDocRef = admin.firestore().collection("users").doc(userId);

    // Check if user exists
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      res.status(404).send({ message: "User not found" });
      return;
    }

    // Create a new recording document reference in the "recordings" sub-collection
    const newRecordingDocRef = userDocRef.collection("recordings").doc();

    // Define the recording data
    const recordingData = {
      id: newRecordingDocRef.id, // ID is same as document ID
      date_created: admin.firestore.Timestamp.now(), // Current timestamp
      name,
      is_public,
      URL,
    };

    // Add the recording data to the new document in Firestore
    await newRecordingDocRef.set(recordingData);

    // Send success response
    res.status(200).send({
      message: "Recording added successfully",
      recordingId: newRecordingDocRef.id, // Return new recording's ID
    });
  } catch (error) {
    // Send error response if any exception occurs
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

/*  POST endpoint to add a favorite raga for a specific user
    URL Example: https://us-central1-ragavaniauth.cloudfunctions.net/api/user/zU8RUJx6kOgLO1gjpa8sGfJJ6Ut2/favorite_raga
    JASON FILE Example Passed to this end point:
    {
        "category": "Melodic3",
        "name": "Raga Bhairavi",
        "inputs": [1, 2, 3, 4, 5, 6, 7],
        "vadi": "Ma",
        "samvadi": "Sa",
        "description": "Raga Bhairavi is often referred to as the queen of ragas..."
    }
 */
// app.post("/user/:userId/favorite_raga", async (req, res) => {
//   try {
//     // Extracting user ID from the URL parameter and raga object from request body
//     const { userId } = req.params;
//     const raga = req.body;

//     // Validations: Ensure raga object has essential properties
//     if (!raga.name || !raga.category || !raga.inputs) {
//       return res.status(400).send("Error: Missing essential raga properties.");
//     }

//     // Reference to the 'users' collection and specific user document in Firestore
//     const userDocRef = admin.firestore().collection("users").doc(userId);

//     // Check if user exists
//     const userDoc = await userDocRef.get();
//     if (!userDoc.exists) {
//       return res.status(404).send("Error: User not found.");
//     }

//     // Reference to 'favorite_raga' sub-collection for the specified user
//     const favoriteRagaCollection = userDocRef.collection("favorite_ragas");

//     // Adding the raga to 'favorite_raga' sub-collection and fetching new raga data
//     const newRagaRef = await favoriteRagaCollection.add(raga);
//     const newRaga = await newRagaRef.get();

//     // Sending back a response with status 201 (Created) and the created raga object
//     res.status(201).send({ id: newRagaRef.id, ...newRaga.data() });
//   } catch (error) {
//     // Handling errors and responding with status 400 (Bad Request) and error message
//     res.status(400).send(`Error: ${error}`);
//   }
// });

app.post("/user/:userId/favorite_raga", async (req, res) => {
  try {
    // Extracting user ID from the URL parameter and raga object from request body
    const { userId } = req.params;
    const raga = req.body;

    // Validations: Ensure raga object has essential properties
    if (!raga.name || !raga.category || !raga.inputs) {
      return res.status(400).send("Error: Missing essential raga properties.");
    }

    // Reference to the 'users' collection and specific user document in Firestore
    const userDocRef = admin.firestore().collection("users").doc(userId);

    // Check if user exists
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return res.status(404).send("Error: User not found.");
    }

    // Reference to 'favorite_raga' sub-collection for the specified user
    const favoriteRagaCollection = userDocRef.collection("favorite_ragas");

    // Generating a new DocumentReference for our new raga
    const newRagaRef = favoriteRagaCollection.doc();

    // Adding the new document ID as a field in the raga object
    raga.id = newRagaRef.id;

    // Saving the raga data to the new document reference
    await newRagaRef.set(raga);

    // Responding with the created raga object
    res.status(201).send(raga);
  } catch (error) {
    // Handling errors and responding with status 400 (Bad Request) and error message
    res.status(400).send(`Error: ${error}`);
  }
});

/* 
    API endpoint to get all users' public recordings
    URL Example: https://us-central1-ragavaniauth.cloudfunctions.net/api/getAllUsersPublicRecordings

    Will retrun the following JASON file format
    [
        {
            "user": {
                "id": "UAWYZr8PMuMeuq0wL8pMMUNnwMt2",
                "user_id": "UAWYZr8PMuMeuq0wL8pMMUNnwMt2",
                "last_name": "Rahimi",
                "first_name": "Wahid",
                "email": "wahid@gmail.com",
                "date_created": {
                    "_seconds": 1696886994,
                    "_nanoseconds": 654000000
                }
            },
            "recordings": [
                {
                    "id": "6m4pggl9tdHsxoNtxilf",
                    "date_created": {
                        "_seconds": 1696893187,
                        "_nanoseconds": 505000000
                    },
                    "name": "My Recording",
                    "is_public": true,
                    "URL": "https://example.com/recording.mp3"
                },
                {
                    "id": "M7LbkxP6Aod9CSi5Sbu6",
                    "date_created": {
                        "_seconds": 1696893298,
                        "_nanoseconds": 832000000
                    },
                    "name": "My Recording 3",
                    "is_public": true,
                    "URL": "https://example.com/recording3.mp3"
                }
            ]
        },
        {
            "user": {
                "id": "zU8RUJx6kOgLO1gjpa8sGfJJ6Ut2",
                "user_id": "zU8RUJx6kOgLO1gjpa8sGfJJ6Ut2",
                "last_name": "User",
                "first_name": "Test",
                "email": "testuser44@example.com",
                "date_created": {
                    "_seconds": 1696885928,
                    "_nanoseconds": 116000000
                }
            },
            "recordings": [
                {
                    "id": "6TJ4iWhzHLmZzVMQuGtg",
                    "date_created": {
                        "_seconds": 1696893456,
                        "_nanoseconds": 755000000
                    },
                    "name": "My Recording 4",
                    "is_public": true,
                    "URL": "https://example.com/recording4.mp3"
                },
                {
                    "id": "oKUWCPOvZs2nposU7W6T",
                    "date_created": {
                        "_seconds": 1696893388,
                        "_nanoseconds": 486000000
                    },
                    "name": "My Recording 1",
                    "is_public": true,
                    "URL": "https://example.com/recording1.mp3"
                },
                {
                    "id": "sYWrASdfG9UkjYTGzyDZ",
                    "date_created": {
                        "_seconds": 1696893406,
                        "_nanoseconds": 889000000
                    },
                    "name": "My Recording 1",
                    "is_public": true,
                    "URL": "https://example.com/recording1.mp3"
                }
            ]
        }
    ]
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

      // Get user's recordings where is_public=true
      const recordingsSnapshot = await usersCollection
        .doc(userDoc.id)
        .collection("recordings")
        .where("is_public", "==", true)
        .get();

      // Iterate through each public recording and add it to the userPublicRecordings array
      recordingsSnapshot.forEach((recordingDoc) => {
        userPublicRecordings.push({
          id: recordingDoc.id,
          ...recordingDoc.data(),
        });
      });

      // If there are any public recordings, add the user and their recordings to results
      if (userPublicRecordings.length > 0) {
        results.push({
          user: {
            id: userDoc.id,
            ...userData,
          },
          recordings: userPublicRecordings,
        });
      }
    }

    // Send response with user data and their public recordings
    res.status(200).send(results);
  } catch (error) {
    // Handling errors and sending a response with status 500 (Internal Server Error) and error message
    console.error("Error:", error);
    res.status(500).send(`Internal Server Error: ${error}`);
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
    API endpoint to get all recordings (public and private) of a specific user.
    URL Example: https://us-central1-ragavaniauth.cloudfunctions.net/api/getAllMyRecordings/zxKAloMo2QUr0pnGupUYsBPPR382
    Returned JSON File format:
    [
      {
          "id": "FMxv8F0BWuA0Ggvnl137",
          "date_created": {
              "_seconds": 1696990154,
              "_nanoseconds": 949000000
          },
          "name": "Yyyyyy",
          "is_public": true,
          "URL": "Yyyyyyy"
      },
      {
          "id": "ipG6I1SE3JABeuRik5nQ",
          "date_created": {
              "_seconds": 1696990143,
              "_nanoseconds": 161000000
          },
          "name": "Sdfsd",
          "is_public": false,
          "URL": "Sdfdsf"
      }
  ]
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
      recordings.push({ id: doc.id, ...doc.data() });
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
    [
        {
            "id": "6m4pggl9tdHsxoNtxilf",
            "date_created": {
                "_seconds": 1696893187,
                "_nanoseconds": 505000000
            },
            "name": "My Recording",
            "is_public": true,
            "URL": "https://example.com/recording.mp3"
        },
        {
            "id": "M7LbkxP6Aod9CSi5Sbu6",
            "date_created": {
                "_seconds": 1696893298,
                "_nanoseconds": 832000000
            },
            "name": "My Recording 3",
            "is_public": true,
            "URL": "https://example.com/recording3.mp3"
        }
    ]
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
      recordings.push({ id: doc.id, ...doc.data() });
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
  [
    {
        "id": "oRuHCtnxPITQW16juzQs",
        "date_created": {
            "_seconds": 1696893234,
            "_nanoseconds": 406000000
        },
        "name": "My Recording 2",
        "is_public": false,
        "URL": "https://example.com/recording2.mp3"
    }
]
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

    // Querying for all public recordings
    const snapshot = await recordingsRef.where("is_public", "==", false).get();

    if (snapshot.empty) {
      // No public recordings found
      return res.status(404).send({ message: "No private recordings found" });
    }

    // Building the response object
    const recordings = [];
    snapshot.forEach((doc) => {
      recordings.push({ id: doc.id, ...doc.data() });
    });

    // Responding with status 200 (OK) and the recordings array
    return res.status(200).send(recordings);
  } catch (error) {
    // Handling errors and responding with status 500 (Internal Server Error) and error message
    console.error("Error fetching public recordings:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
});

// exports the APIs to the firestore database
exports.api = functions.https.onRequest(app);
