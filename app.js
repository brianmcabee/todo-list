const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(express.static("public"));

// DB Stuff //
mongoose.connect('mongodb+srv://admin-brian:Test123@cluster0.g8paj.mongodb.net/todolistDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// DB Schema for items in a list
const itemSchema = {
  name: String
};

//make mongoose model collection
const Item = mongoose.model('Item', itemSchema);

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

const defaultItems = [item1, item2, item3];

// db schema for lists
// contains name of list of array of items made of itemSchema
const listSchema = {
  name: String,
  items: [itemSchema]
};

// create list collection
const List = mongoose.model("List", listSchema);

// localhost port to listen on
let port = process.env.PORT;

if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  if (port === 3000) {
      console.log("App started on port " + port);
  }

});

// List title for homepage
const defaultListTitle = "Today";


// array for all list names (default and custom)
var allListNames = [defaultListTitle];

// get all custom list names and add them to allListNames
List.find({}).select('name').exec(function(err,docs){
    for (var i = 0; i < docs.length; i++) {
      allListNames.push(docs[i].name);
    }
  }
);


// route for home page
app.get("/", function(req, res) {

  // ADD BACK IN DATE TO TITLE LATER
  // var date = new Date();
  //
  // var options = {
  //   weekday: "long",
  //   // day: "numeric",
  //   // month: "long",
  //   // year: "numeric"
  // };
  // var today = date.toLocaleDateString("en-US", options);

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
      res.redirect('/');
    } else {
      res.render("list", {
        listTitle: defaultListTitle,
        itemsArray: docs,
        listNameArray: allListNames,
        defaultListTitle: defaultListTitle
      });
    }
  });

  console.log(allListNames);
});

// route for custom lists
app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);


  List.findOne({name: customListName}, function(err, listName) {
    if (!err) {
      if (listName) {
        // if list exists, show list
        res.render("list", {
          listTitle: listName.name,
          itemsArray: listName.items,
          listNameArray: allListNames,
          defaultListTitle: defaultListTitle
        });
      }
      else {
        // if list doesnt exist, make list
        const list = new List({
          name: customListName,
          items: defaultItems
        })
        list.save();

        if (!allListNames.includes(customListName)) {
          allListNames.push(customListName);
        }
        res.redirect("/"+customListName);
      }
    }
    else {
      console.log(err);
    }
  })
})

app.post("/", function(req, res) {
  var inputTxt = req.body.newItem;
  var listTitle = req.body.list;

  const newlyAddedItem = new Item({
    name: inputTxt
  });

  // Add to appropriate List
  if (listTitle === defaultListTitle) {
    newlyAddedItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listTitle}, function(err, foundList){
      foundList.items.push(newlyAddedItem);
      foundList.save();
      res.redirect("/"+listTitle);
    });
  }
});

// post method to remove item when checked
app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.currentListName;

  if (listName === defaultListTitle) {
    // delete item in mongoose from default list
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Item with id " + checkedItemId + " removed");
        res.redirect('/');
      }
    });
  } else {
    // delete item from custom list
    List.findOneAndUpdate(
      {name: listName},
      // query below means, remove (pull) element from an array in the found doc
      // based on condition
      { $pull: {items: {_id: checkedItemId}}},
      function(err,foundList) {
        if (!err) {
          // if no errors, redirect to custom list page
          res.redirect('/'+listName);
        }
      })
  }
})

// post method to create a new list
app.post("/create-list", function(req, res) {
  const newListName = req.body.newList;

  // if list is already created, navigate to list
  res.redirect('/'+newListName);
})

// post method to delete a current list that is not the default list
//  After deletion, redirect to default list
app.post("/delete-list", function(req, res) {
  const listNameToDelete = req.body.deleteListBtn;
  const listNameToDeleteIndex = allListNames.indexOf(listNameToDelete);
  // delete from mongodb
  List.findOneAndDelete({name: listNameToDelete}, function(err, docs) {
    if (err) {
      console.log(err);
    } else {
      console.log(docs.name + " list removed from db");
    }
  })

  // remove element from array
  allListNames.splice(listNameToDeleteIndex,1);

  // nav back to homepage
  res.redirect('/');
})
