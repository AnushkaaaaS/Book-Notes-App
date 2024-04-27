import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config({path: './pass.env'});

const app = express();
const port = 3000;
app.use('/public', express.static('public'));





const connectionString = `postgresql://${process.env.user}:${process.env.password}@${process.env.host}:${process.env.port}/${process.env.database}`;

const db = new pg.Client({
  connectionString: connectionString,
});

//db.connect()
 // .then(() => {
   // console.log('Connected to the PostgreSQL database');
  //})
  //.catch((err) => {
    //console.error('Error connecting to PostgreSQL database:', err);
  //})




const API_URL = "https://openlibrary.org/search.json?q=";
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req,res)=>{
    res.render("login.ejs");
});

var email;
var password;


app.post("/login", async (req, res) => {
   email = req.body.username;
   password = req.body.password;
   await getUser(email);

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (checkResult.rows.length > 0) {
      const user = checkResult.rows[0];
      const storedPassword = user.password;

      

      if (password === storedPassword) {
         res.render("index.ejs")
         ;      } else {
  return res.render("login.ejs",{
    message: "Incorrect password",
    classname: "alert alert-danger"
  });
      }
    } else {
       res.render("login.ejs",{
        message: "User not found",
        classname: "alert alert-danger"
      });    }
  } catch (err) {
    console.log(err);
  }
});



var user;

async function getUser(email){
   user=email;
  console.log(user);
}
console.log(user);
app.post("/search", async (req, res) => {
    const bookName = req.body.name;
  
    try {
      const result= await axios.get(API_URL +bookName);
      const length=result.data.docs.length;
     
     

      res.render("index.ejs", { data : result.data,
      length:length });
    } catch (error) {
      res.send("Book not found");
    }
  });

  

  app.get("/tbr",async(req,res)=>{
        const result= await db.query("select * from tbr where email=$1;",[user]);
        const tbr= result.rows;
        console.log(tbr);
        res.render("tbr.ejs",{tbrItems:tbr}
        );
      
   
  });

  app.get("/read",async(req,res)=>{
    const result= await db.query("select * from read_books where email=$1;",[user]);
    const read= result.rows;
    
    
    res.render("read.ejs",{readItems:read}
    );
  });


 

app.get("/addtbr/:title",async (req,res)=>{
  let title=req.params.title;
  const result= await axios.get(API_URL +title);
  const author=result.data.docs[0].author_name[0];
  const imgURL=`https://covers.openlibrary.org/b/isbn/${result.data.docs[0].isbn[0]}-S.jpg`;
  let date = new Date().toISOString().slice(0, 10);
  let result1= await db.query("select * from tbr where title=$1 and email=$2;",[title,user]);
  if(result1.rows.length==0)
  {
  db.query("insert into tbr(title,author,imgurl,email,date) values($1,$2,$3,$4,$5);",[title,author,imgURL,user,date]);
  res.redirect("/tbr");
  }
  else{
    res.send("Book already added");
  }
  
  });

app.get("/search",(req,res)=>{
  res.render("index.ejs");
})

app.get("/addread/:title",async (req,res)=>{
  
  let title=req.params.title;
  
  const result= await axios.get(API_URL +title);
  const author=result.data.docs[0].author_name[0];

  const imgURL=`https://covers.openlibrary.org/b/isbn/${result.data.docs[0].isbn[0]}-S.jpg`;
  let date = new Date().toISOString().slice(0, 10);
  let result1= await db.query("select * from read_books where title=$1 and email=$2;",[title,user]);
  if(result1.rows.length==0){
  db.query("insert into read_books(title,author,imgurl,email,date) values($1,$2,$3,$4,$5);",[title,author,imgURL,user,date]);
  res.redirect("/read");
  }
  else{
    res.send("Book already added");
  }





})

app.post("/add/:id",async(req,res)=>{
  let id= req.params.id;
  let result= await db.query("select * from tbr where id=$1 and email=$2;",[id,user]);
  let title= result.rows[0].title;
  console.log(title);
  let author= result.rows[0].author;
  let imgURL= result.rows[0].imgurl;
  let date = new Date().toISOString().slice(0, 10);
  let result1= await db.query("select * from read_books where title=$1 and email=$2;",[title,user]);
  if(result1.rows.length==0){
  db.query("insert into read_books(title,author,imgurl,email,date) values($1,$2,$3,$4,$5);",[title,author,imgURL,user,date]);
  db.query("delete from tbr where id=($1)and email=($2);",[id,user]);
  res.redirect("/tbr");
  }
  else{
    res.send("Book already added");
  }
  
})


app.post("/deletetbr/:id", (req, res) => {
  let deleteId=req.params.id
  console.log(deleteId);
  try{
  db.query("delete from tbr where id=($1);",[deleteId]);
  res.redirect("/tbr");
  }
  catch(error){
    res.send(error);
  }
});

app.post("/deleteread/:id", async(req, res) => {
  let deleteId=req.params.id
  try{
  
  db.query("delete from read_books where id=($1);",[deleteId]);
  res.redirect("/read");
  }
  catch(error){
    res.send(error);
  }
});

app.get("/writereview/:title", async (req,res)=>{
  let title=req.params.title;
  const result= await axios.get(API_URL +title);
  const author=result.data.docs[0].author_name[0];
  console.log(author);
  const imgURL=`https://covers.openlibrary.org/b/isbn/${result.data.docs[0].isbn[0]}-L.jpg`;
  let result1= await db.query("select * from reviews where title=$1 and email=$2;",[title,user]);
  if(result1.rows.length==0){
  res.render("review.ejs",{
    title: title,
    author:author,
    imgURL:imgURL
  });
}
else{
  res.send("Review already written. Try to edit or view");
}

})

app.get("/editreview/:title", async (req,res)=>{
  let title= req.params.title;
  
  let result1= await db.query("select * from reviews where title=$1 and email=$2;",[title,user]);
  if(result1.rows.length==0){
    res.send("Write a review to edit");
  }
  else{
    let heading= (await db.query("select heading from reviews where title=$1 and email=$2;",[title,user])).rows[0].heading;

  let review= (await db.query("select review from reviews where title=$1 and email=$2;",[title,user])).rows[0].review;
  const result= await axios.get(API_URL +title);
  const author=result.data.docs[0].author_name[0];
  const imgURL=`https://covers.openlibrary.org/b/isbn/${result.data.docs[0].isbn[0]}-L.jpg`;
    res.render("modify.ejs",{
      title: title,
      author:author,
      imgURL:imgURL,
      heading: heading,
      review:review
    });
}

 
  });

  app.get("/viewreview/:title",async(req,res)=>{
    let title= req.params.title;
   let result1= await db.query("select * from reviews where title=$1 and email=$2;",[title,user]);
  if(result1.rows.length==0){
    res.send("Write a review to view");
  }else{
    let heading= (await db.query("select heading from reviews where title=$1 and email=$2;",[title,user])).rows[0].heading;
    console.log(heading);
    let review= (await db.query("select review from reviews where title=$1 and email=$2;",[title,user])).rows[0].review;
    const result= await axios.get(API_URL +title);
    const author=result.data.docs[0].author_name[0];
    const imgURL=`https://covers.openlibrary.org/b/isbn/${result.data.docs[0].isbn[0]}-L.jpg`;
    res.render("view.ejs",{
      title: title,
      author:author,
      imgURL:imgURL,
      heading: heading,
      review:review
    });
  }
  
  })


app.post("/submit/:title",(req,res)=>{
  let title=req.params.title
  let heading=req.body.heading;
  let review=req.body.review;
  try{

  db.query("insert into reviews(title,heading,review,email) values($1,$2,$3,$4);",[title,heading,review,user]);
  res.redirect("/read");
  }
  catch(error){
    res.send(error);
  }
})

app.post("/modify/:title",(req,res)=>{
  let title=req.params.title
  let heading=req.body.heading;
  let review=req.body.review;
  try{
  db.query("update reviews set heading=$1,review=$2 where title=$3;",[heading,review,title]);


  res.redirect("/read");
  }
  catch(error){
    res.send(error);
  }
})




app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    

    if (checkResult.rows.length > 0) {
  res.render("register.ejs",{
  message: "Email already exists,try logging in",
  classname: "alert alert-danger"
});
    } else {
      const result = await db.query(
        "INSERT INTO users (email, password) VALUES ($1, $2)",
        [email, password]
      );
      return res.render("register.ejs",{
        message: "User registered successfully. Login",
        classname: "alert alert-success"
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.get("/getregister",(req,res)=>{
res.render("register.ejs");
});
app.get("/getlogin",(req,res)=>{
  res.render("login.ejs");
  });


  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });