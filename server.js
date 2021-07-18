const {Pool} = require("pg")
const express = require ("express");
const { text } = require("express");
const app = express();
app.use(express.json())

const pool = new Pool({
    "user": "postgres",
    "password" : "122236",
    "host" : "localhost",
    "port" : 5432,
    "database" : "todo"
})

 
app.get("/", (req, res) => res.send("hiii!!!"))

app.get("/tweets", async (req, res) => {
    // create temp table for show in post request
    var Qtemp_create =`create table IF NOT EXISTS temp
    (
        id int, 
        content Varchar(255), 
        username Varchar(255), 
        timestamp Varchar(10), 
        likes_count int,
        retweets_count int
    )`
    const results = await pool.query(Qtemp_create);
    
    
    const Qtweet = await pool.query("SELECT * FROM tweet")

    const Qretweet = await pool.query("SELECT * FROM retweet")
    const Qlikes = await pool.query("SELECT * FROM likes")


    var temp={}
    var like={}
    var retweets_count={}
    var qtempInsert={}
    like= await pool.query("SELECT l.post_id,COUNT(*) FROM likes l JOIN tweet t ON t.post_id = l.post_id  GROUP BY l.post_id")
    retweets_count = await pool.query("SELECT r.post_id,COUNT(*) FROM retweet r LEFT JOIN tweet t ON t.post_id = r.post_id  GROUP BY r.post_id")
    console.log(like.rows)
        // insert all without like and retweet_count
        for ( var i =0 ; i<Qtweet.rowCount; i++){
             qtempInsert=`INSERT into temp (id,content,username,timestamp,likes_count,retweets_count) VALUES (${Qtweet.rows[i].post_id},'${Qtweet.rows[i].content}','${Qtweet.rows[i].username}','${Qtweet.rows[i].timestamp}', 0,0)`
         
            temp = await pool.query (qtempInsert)
        }
        /// insert like
        for ( var i =0 ; i<like.rowCount; i++){
            const qtempupdate=`UPDATE temp SET likes_count = ${like.rows[i].count} WHERE id = ${like.rows[i].post_id}`
           temp = await pool.query (qtempupdate)
       }
       // insert retweets_count
       for ( var i =0 ; i<retweets_count.rowCount; i++){
        const qtempupdate=`UPDATE temp SET retweets_count = ${retweets_count.rows[i].count} WHERE id = ${retweets_count.rows[i].post_id}`
       temp = await pool.query (qtempupdate)
   }
       


        const rows = await pool.query("SELECT * FROM temp")       
        res.setHeader("content-type", "application/json")
        res.send(JSON.stringify(rows.rows))
        pool.query("DROP TABLE temp;");  
  
})

app.get("/retweets", async (req, res) => {
    // create temp table for show in post request
    var Qtemp_create =`create table IF NOT EXISTS temp1
    ( 
        content Varchar(255), 
        retweet_user Varchar(255), 
        tweet_id int,
        timestamp Varchar(10), 
        tweet_user Varchar(255)
    )`
    const results = await pool.query(Qtemp_create);
    const Qtweet = await pool.query("SELECT * FROM tweet")
    const Qretweet = await pool.query("SELECT * FROM retweet")

    var temp={}
    var qtempInsert={}
    retweet_user= await pool.query("SELECT r.username,r.post_id FROM retweet r JOIN tweet t ON t.post_id = r.post_id ")
        // insert all without retweet_username
        for ( var i =0 ; i<Qtweet.rowCount; i++){
             qtempInsert=`INSERT into temp1 (content,retweet_user,tweet_id,timestamp,tweet_user) VALUES ('${Qtweet.rows[i].content}','null',${Qtweet.rows[i].post_id},'${Qtweet.rows[i].timestamp}','${Qtweet.rows[i].username}')`
            temp = await pool.query (qtempInsert)
        }
        /// insert retweet_user
        for ( var i =0 ; i<retweet_user.rowCount; i++){
            const qtempupdate=`UPDATE temp1 SET retweet_user = '${retweet_user.rows[i].username}' WHERE tweet_id = ${retweet_user.rows[i].post_id}`
           temp = await pool.query (qtempupdate)
       }
    
       

        const delete_null = await pool.query ("delete from temp1 where retweet_user = 'null'")
        const rows = await pool.query("SELECT * FROM temp1")       
        res.setHeader("content-type", "application/json")
        res.send(JSON.stringify(rows.rows))
        pool.query("DROP TABLE temp1");  
  
})


app.post("/tweets", async (req, res) => {
    let result = {}
    try{
        const reqJson = req.body;
        result.success = await createTweet(reqJson.content,reqJson.username)
    }
    catch(e){
        result.success=false;
    }
    finally{
        res.setHeader("content-type", "application/json")
        res.send(JSON.stringify(result))
    }
   
})





app.post("/tweets/:id/likes", async (req, res) => {
    let result = {}
    try{
        const reqJson = req.body;
        const id = req.params.id
        console.log(id)
        var dateObj = new Date();
        var month = dateObj.getUTCMonth() + 1; //months from 1-12
        var day = dateObj.getUTCDate();
        var year = dateObj.getUTCFullYear();
        newdate = day + "-" + month + "-" + year;
        var temp = `insert into likes (post_id,username,timestamp) values (${id},'${reqJson.username}','${newdate}')`
       result.success= await pool.query(temp);

    }
    catch(e){
        result.success=false
        console.log(e)
    }
    finally{
        res.setHeader("content-type", "application/json")
        res.send(JSON.stringify(result))
    }
   
})


app.post("/tweets/:id/retweet", async (req, res) => {
    let result = {}
    try{
        const reqJson = req.body;
        const id = req.params.id
        console.log(id)
        var dateObj = new Date();
        var month = dateObj.getUTCMonth() + 1; //months from 1-12
        var day = dateObj.getUTCDate();
        var year = dateObj.getUTCFullYear();
        newdate = day + "-" + month + "-" + year;
        var temp = `insert into retweet (post_id,username,timestamp) values (${id},'${reqJson.username}','${newdate}')`
       result.success= await pool.query(temp);

    }
    catch(e){
        result.success=false
        console.log(e)
    }
    finally{
        res.setHeader("content-type", "application/json")
        res.send(JSON.stringify(result))
    }
   
})



app.listen(8080, () => console.log("Web server is listening.. on port 8080"))

start()

async function start() {
    await connect();
}

async function connect() {
    try {
        await pool.connect(); 
    }
    catch(e) {
        console.error(`Failed to connect ${e}`)
    }
}


async function createTweet(content,username){
    
    try {
        


        var dateObj = new Date();
        var month = dateObj.getUTCMonth() + 1; //months from 1-12
        var day = dateObj.getUTCDate();
        var year = dateObj.getUTCFullYear();
        newdate = day + "-" + month + "-" + year;
        var temp = `insert into tweet (content,username,timestamp) values ('${content}','${username}','${newdate}')`
        await pool.query(temp);
        return true
        }
        catch(e){
            console.log(e)
            return false;
        }
}

