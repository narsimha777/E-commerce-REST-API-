const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db/index');
const {passwordHash, authenticate} = require('./authentication');
const passport = require('passport');
const localstrategy = require('passport-local').Strategy;
const session = require('express-session');

const PORT = 8080;
const store = new session.MemoryStore();
const app = express();

//middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret:"d1f2g3hj4",
    resave: false,
    saveUninitialized: false,
    store,
    cookie:{maxAge: 3*60*60*60, secure:true, sameSite: "none"}
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new localstrategy((customer_id, password, done) => {

  db.query('SELECT password FROM customers WHERE customer_id = $1', [customer_id])
    .then(result => {
      if (result.rows.length > 0) {
        const passwordInData = result.rows[0].password;

        if (authenticate(password, passwordInData)) {
          return done(null, { customer_id: customer_id });
        } else {
          return done(null, false, { message: 'Incorrect password' });
        }
      } else {
        return done(null, false, { message: 'User not found' });
      }
    })
    .catch(err => {
      return done(err);
    });
}));


//operations

//get
app.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT orders.status, products.name, customers.name FROM orders JOIN products ON orders.product_id = products.product_id JOIN customers ON orders.customer_id = customers.customer_id');
    if (result) {
      res.status(200).send(result);
    } else {
      res.status(404).send();
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/orders', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM orders');
    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/customers', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM customers');
    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/customers/:id', async(req, res)=>{
    const customer_id = req.params.id;
    try{
        const result= await db.query('Select * from customers where customer_id = $1', [customer_id]);
        res.status(200).send(result);
    } catch(error){
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
})

app.get('/products', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM products');
    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

//post
app.post('/neworder', async(req, res) => {
  // Your POST request handling logic goes here
  const {id, status, quantity, product_id, customer_id} = req.body;
  if(id){
      await db.query('insert into orders(id, status, quantity, product_id, customer_id) values($1,$2,$3,$4,$5)',[id,status,quantity,product_id,customer_id]);
      res.status(200).send('POST request received');
  }else{
    res.status(404).send('Primary key not found');
  }
});

app.post('/newcustomer', async(req, res)=>{
    const {customer_id, name, phone_number} = req.body;
    if(customer_id){
        await db.query('insert into customers(customer_id, name, phone_number) values($1,$2,$3)',[customer_id,name,phone_number]);
        res.status(200).send('POST request received');
    }else{
        res.status(404).send('Primary key not found');
    }
});

app.post('/newproduct', async(req, res)=>{
    const {product_id, name, specifications} = req.body;
    if(product_id){
        await db.query('insert into products(product_id, name, specifications) values($1,$2,$3)',[product_id, name, specifications]);
        res.status(200).send('POST request received');
    }else{
        res.status(404).send('Primary key not found');
    }
});

//update
app.put('/customers/:id', async(req, res)=>{
    const {name, phone_number} = req.body;
    const customer_id = req.params.id;
    if(customer_id && name){
        await db.query('update customers set name = $1 where customer_id = $2',[name, customer_id]);
        res.status(200).send('Update completed');
    }else if(customer_id && phone_number){
        await db.query('update customers set phone_number = $1 where customer_id = $2',[phone_number, customer_id]);
        res.status(200).send('Update Completed');
    }else{
        res.status(404).send('All details are not sent');
    }  
});

app.put('/products/:id', async(req, res)=>{
    const {name, specifications} = req.body;
    const product_id = req.params.id;
    if(product_id && name){
        await db.query('update products set name = $1 where product_id = $2',[name, product_id]);
        res.status(200).send('Update completed');
    }else if(product_id && specifications){
        await db.query('update products set specifications = $1 where product_id = $2',[specifications, product_id]);
        res.status(200).send('Update Completed');
    }else{
        res.status(404).send('All details are not sent');
    }  
});

//delete
app.delete('/customers/:id', async(req, res)=>{
    const customer_id = req.params.id;
    if(customer_id){
        await db.query('delete from customers where customer_id = $1',[customer_id]);
        res.status(200).send('Deleted');
    }else{
        res.status(404).send('ID id not sent');
    }
});

app.delete('/products/:id', async(req, res)=>{
    const product_id = req.params.id;
    if(product_id){
        await db.query('delete from products where product_id = $1',[product_id]);
        res.status(200).send('Deleted');
    }else{
        res.status(404).send('ID not sent');
    }
});

//register
app.post('/register',async(req, res)=>{
    const {customer_id, password} = req.body;
    const hashed = passwordHash(password,10);
    if(customer_id){
        await db.query('Update customers set password = $2 where customer_id = $1',[customer_id, hashed]);
        res.status(200).send('Registered');
    }else{
        res.status(500).send('ID not sent');
    }
});

//authentication

app.post('/login', passport.authenticate("local", {
    failureRedirect: "/",
}), (req, res) => {
    const { customer_id } = req.body;
    if (req.isAuthenticated()) {
        res.redirect(`/customers/${customer_id}`);
    } else {
        res.redirect("/");
    }
});

app.get('/logout', (req, res) => {
    if (req.isAuthenticated()) {
      req.logout();
      res.redirect('/');
    } else {
      res.redirect('/');
    }
  });
  

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
