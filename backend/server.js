const express = require("express")
const cors = require("cors")
const sqlite3 = require("sqlite3").verbose()

const app = express()

app.use(cors())
app.use(express.json())

const db = new sqlite3.Database("./dsa.db")

db.serialize(() => {
db.run(`
CREATE TABLE IF NOT EXISTS problems (
id INTEGER PRIMARY KEY AUTOINCREMENT,
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

const {name,platform,difficulty,pattern,time,date,revision,notes,code}=req.body

db.run(`
INSERT INTO problems
(name,platform,difficulty,pattern,time,date,revision,notes,code)
VALUES (?,?,?,?,?,?,?,?,?)
`,
[name,platform,difficulty,pattern,time,date,revision,notes,code],
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
app.get("/", (req, res) => {
res.send("DSA Learning Analytics Backend Running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});
