const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static("public"));


var port = 3000;

var items = [];

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

  var today = date.toLocaleDateString("en-US",options)

  res.render("list", {todaysDate : today, itemsArray : items});
});

app.post("/", function(req, res) {
  var inputTxt = req.body.newItem;

  items.push(inputTxt);

  res.redirect("/");
})
