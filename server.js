const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb'); 

const app = express();
const uri = 'mongodb://localhost:27017';
const dbName = 'test';
const collectionName = 'persondatas';

const PORT = 3000;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

let list = [];

async function fetchDocuments() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB!');
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        list = await collection.find({}).toArray();
        console.log('Documents retrieved:', list);
    } catch (error) {
        console.error('Error retrieving documents:', error);
    } finally {
        await client.close();
        console.log('Connection closed.');
    }
}

fetchDocuments();

app.get("/", async (req, res) => {
    await fetchDocuments(); 

    const peopleListHTML = list.map(person => `
        <div class="person-item">
            <p><strong>Name:</strong> ${person.name} | <strong>Age:</strong> ${person.age} | <strong>Gender:</strong> ${person.gender} | <strong>Mobile:</strong> ${person.mobile}</p>
            <form action="/update/${person._id}" method="POST">
                <button class="btn btn-primary" type="submit">Edit</button>
            </form>
            <form action="/delete/${person._id}" method="POST">
                <button class="btn btn-danger" type="submit">Delete</button>
            </form>
        </div>
    `).join("");

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Person Management</title>
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap" rel="stylesheet">
            <style>
                body {
                    font-family: 'Roboto', sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f7f7f7;
                    color: #333;
                }
                h2 {
                    color: #fff;
                    background-color: #007BFF;
                    padding: 15px;
                    margin: 0;
                    text-align: center;
                    border-radius: 4px;
                    font-size: 24px;
                }
                .form-container, .list-container {
                    background: #ffffff;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                    margin: 20px auto;
                    max-width: 600px;
                    font-size: 16px;
                }
                .form-group {
                    margin-bottom: 20px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #555;
                }
                .form-group input {
                    width: 100%;
                    padding: 12px;
                    border-radius: 4px;
                    border: 1px solid #ccc;
                    font-size: 16px;
                }
                .form-group button {
                    width: 100%;
                    padding: 12px;
                    border: none;
                    background-color: #007BFF;
                    color: white;
                    font-size: 16px;
                    cursor: pointer;
                    border-radius: 4px;
                }
                .form-group button:hover {
                    background-color: #0056b3;
                }
                .list-container {
                    padding-top: 20px;
                }
                .person-item {
                    background: #f9f9f9;
                    padding: 15px;
                    margin-bottom: 10px;
                    border-radius: 6px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                .person-item p {
                    margin: 0;
                    flex-grow: 1;
                    color: #333;
                }
                .person-item form {
                    margin-left: 10px;
                }
                .btn {
                    padding: 10px 15px;
                    border-radius: 4px;
                    font-size: 14px;
                    border: none;
                    cursor: pointer;
                }
                .btn-primary {
                    background-color: #28a745;
                    color: white;
                }
                .btn-primary:hover {
                    background-color: #218838;
                }
                .btn-danger {
                    background-color: #dc3545;
                    color: white;
                }
                .btn-danger:hover {
                    background-color: #c82333;
                }
                footer {
                    text-align: center;
                    padding: 20px;
                    background-color: #007BFF;
                    color: white;
                    margin-top: 40px;
                }
            </style>
        </head>
        <body>
            <div class="form-container">
                <h2>Add / Update Person</h2>
                <form action="/submit" method="POST">
                    <input type="hidden" id="id" name="id">
                    <div class="form-group">
                        <label for="name">Name:</label>
                        <input type="text" id="name" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="age">Age:</label>
                        <input type="number" id="age" name="age" required>
                    </div>
                    <div class="form-group">
                        <label for="gender">Gender:</label>
                        <input type="text" id="gender" name="gender" required>
                    </div>
                    <div class="form-group">
                        <label for="mobile">Mobile:</label>
                        <input type="text" id="mobile" name="mobile" required>
                    </div>
                    <div class="form-group">
                        <button type="submit">Submit</button>
                    </div>
                </form>
            </div>
            <div class="list-container">
                <h2>Person List</h2>
                ${peopleListHTML}
            </div>
            <footer>
                <p>&copy; 2024 Person Management. All rights reserved.</p>
            </footer>
        </body>
        </html>
    `);
});

app.post("/submit", async (req, res) => {
    const { id, name, age, gender, mobile } = req.body;

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        if (id) {
            await collection.updateOne(
                { _id: ObjectId(id) },
                { $set: { name, age: parseInt(age), gender, mobile } }
            );
            console.log(`Person with ID ${id} updated.`);
        } else {
            await collection.insertOne({ name, age: parseInt(age), gender, mobile });
            console.log(`New person added: ${name}`);
        }
    } catch (error) {
        console.error('Error updating/adding person:', error);
    } finally {
        await client.close();
    }

    res.redirect("/");
});

app.post("/update/:id", async (req, res) => {
    const { id } = req.params;
    console.log("-----------------------------");
    console.log("[LOG]: updating person with ID", id);
    console.log("-----------------------------");

    const client = new MongoClient(uri);
    let person;
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        person = await collection.findOne({ _id: new ObjectId(id) });
    } catch (error) {
        console.error('Error retrieving person for update:', error);
    } finally {
        await client.close();
    }

    if (person) {
        res.send(`
            <script>
                window.onload = function() {
                    document.getElementById('id').value = '${id}';
                    document.getElementById('name').value = '${person.name}';
                    document.getElementById('age').value = '${person.age}';
                    document.getElementById('gender').value = '${person.gender}';
                    document.getElementById('mobile').value = '${person.mobile}';
                };
            </script>
            <h2>Update Person Information</h2>
            <form action="/submit-update" method="POST">
                <input type="hidden" id="id" name="id" value="">
                <div class="form-group">
                    <label for="name">Name:</label>
                    <input type="text" id="name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="age">Age:</label>
                    <input type="number" id="age" name="age" required>
                </div>
                <div class="form-group">
                    <label for="gender">Gender:</label>
                    <input type="text" id="gender" name="gender" required>
                </div>
                <div class="form-group">
                    <label for="mobile">Mobile:</label>
                    <input type="text" id="mobile" name="mobile" required>
                </div>
                <div class="form-group">
                    <button type="submit">Update</button>
                </div>
            </form>
        `);
    } else {
        res.redirect("/");
    }
});

app.post("/submit-update", async (req, res) => {
    const { id, name, age, gender, mobile } = req.body;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },  
            { $set: { name, age, gender, mobile } } 
        );

        if (result.modifiedCount === 1) {
            console.log(`Person with ID ${id} updated.`);
            res.send(`<h1>Person Data Updated Successfully</h1><a href="/">Go back</a>`);
        } else {
            console.log(`No person found with ID ${id} to update.`);
            res.redirect("/");
        }
    } catch (error) {
        console.error('Error updating person:', error);
    } finally {
        await client.close();
    }
});

app.post("/delete/:id", async (req, res) => {
    const { id } = req.params;

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 1) {
            console.log(`Person with ID ${id} deleted.`);
        } else {
            console.log(`No person found with ID ${id}.`);
        }
    } catch (error) {
        console.error('Error deleting person:', error);
    } finally {
        await client.close();
    }
    res.redirect("/");
});

app.listen(PORT, () => {
    console.log(`[log] Server running on port: ${PORT}`);
});
