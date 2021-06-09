const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');

// localhost port to listen on
var port = 3000;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static("public"));

// DB Stuff //
mongoose.connect('mongodb://localhost:27017/todolistDB', {useNewUrlParser: true, useUnifiedTopology: true});

// DB Schema
const itemSchema = {
    name: String
};

//make mongoose model collection
const Item = mongoose.model('Item',itemSchema);

// Create 3 default items for todolist view
const item1 = new Item({
  name: "Welcome to your new ToDo List!"
});

const item2 = new Item({
  name: "Hit the + Button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1,item2,item3];


app.listen(port, function() {
  console.log("App started on port " + port);
});


app.get("/", function(req, res) {

  var date = new Date();

  var options = {
    weekday: "long",
    // day: "numeric",
    // month: "long",
    // year: "numeric"
  };

  var today = date.toLocaleDateString("en-US",options);

  // put items from mongoose db onto todo App
  // if no items in DB, add default items to todolist from above
  // if items in db, add to web app
  Item.find({}, function(err, docs) {

    if (docs.length === 0) {
      // insert default items
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log('Default Items in there');
        }
      });
      res.redirect('/')
    } else {
      res.render("list", {todaysDate : today, itemsArray : docs});
    }

  });


});

app.post("/", function(req, res) {
  var inputTxt = req.body.newItem;

  items.push(inputTxt);

  res.redirect("/");
})
