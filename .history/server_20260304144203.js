const express = require('express');
const sqlite3=require('sqlite3').verbose;
const cors = require('cors');

const app = express();
const PORT= 5000;

//middleware
app.use(cors());
app.use(express.json());

//connect to database
const db=new sqlite3.Database('./fitness.db',(err) =>{
    if(err)console.error("Database connection error:", err.message);
    else console.log("Connected to the fitness database.");
});

//create tables
db.serialize(() => {
    db.run('
        CREATE TABLE IF NOT EXISTS Daily_Logs(
        '))