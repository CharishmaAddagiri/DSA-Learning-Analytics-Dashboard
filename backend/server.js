const express = require("express")
const cors = require("cors")
const sqlite3 = require("sqlite3").verbose()

const app = express()

app.use(cors())
app.use(express.json())

const db = new sqlite3.Database("./dsa.db")

db.serialize(() => {
db.run(`CREATE TABLE IF NOT EXISTS users (
id INTEGER PRIMARY KEY AUTOINCREMENT,
username TEXT UNIQUE,
password TEXT
)
`)
db.run(`
CREATE TABLE IF NOT EXISTS problems (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER,
name TEXT,
platform TEXT,
difficulty TEXT,
pattern TEXT,
time INTEGER,
date TEXT,
revision TEXT,
notes TEXT,
code TEXT
)
`)
})

app.get("/problems",(req,res)=>{
db.all("SELECT * FROM problems",(err,rows)=>{
if(err) res.send(err)
else res.json(rows)
})
})

app.post("/add-problem",(req,res)=>{

const {user_id,name,platform,difficulty,pattern,time,date,revision,notes,code}=req.body

db.run(`
INSERT INTO problems
(user_id,name,platform,difficulty,pattern,time,date,revision,notes,code)
VALUES (?,?,?,?,?,?,?,?,?,?)
`,
[user_id,name,platform,difficulty,pattern,time,date,revision,notes,code],
function(err){

if(err) res.send(err)
else res.send({id:this.lastID})

})

})

app.delete("/delete/:id",(req,res)=>{

db.run(
"DELETE FROM problems WHERE id=?",
req.params.id,
function(err){

if(err) res.send(err)
else res.send("Deleted")

})

})
app.post("/signup",(req,res)=>{

const {username,password} = req.body

db.run(
"INSERT INTO users (username,password) VALUES (?,?)",
[username,password],
function(err){

if(err){
res.status(400).send("User already exists")
}
else{
res.send({user_id:this.lastID})
}

})

})
app.post("/login",(req,res)=>{

const {username,password} = req.body

db.get(
"SELECT * FROM users WHERE username=? AND password=?",
[username,password],
(err,row)=>{

if(err) return res.send(err)

if(!row){
res.status(401).send("Invalid credentials")
}
else{
res.send({user_id:row.id})
}

})

})
app.get("/problems/:user_id",(req,res)=>{

const user_id = req.params.user_id

db.all(
"SELECT * FROM problems WHERE user_id=?",
[user_id],
(err,rows)=>{

if(err) res.send(err)
else res.json(rows)

})

})
app.get("/reset-db",(req,res)=>{

db.run("DELETE FROM users")
db.run("DELETE FROM problems")

res.send("Database reset successfully")

})

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});
