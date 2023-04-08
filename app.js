const port = process.env.PORT || 3000;
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//Connecting mongodb with app
mongoose.connect('mongodb://127.0.0.1:27017/todolistDB');

//Schema for our list
const itemSchema = {
  name: String
};

//Creating database using list Schema
const Item = mongoose.model("Item", itemSchema);

//Default itemns for our list
const item1 = new Item({
  name: "Welcome to do your list!"
});

const item2 = new Item({
  name: "You can use + to add tasks and Check them to remove from list"
});

const defaultItems = [item1, item2];

//Schema for dynamic list with any name
const listSchema = {
  name: String,
  items: [itemSchema]
};

//Creating database for our dynamic list
const List = mongoose.model("List", listSchema);

//get method to load our default list
app.get("/", async function (req, res) {
  //get current day 
  const day = date.getDate();
  try {
    const items = await Item.find();
    if (items.length === 0) {
      //if our list is empty we will insert default items
      await Item.insertMany(defaultItems);
      //console.log("Successfully Inserted");
      res.redirect("/");
    } else {
      //else render list 
      res.render("list", { listTitle: day, newListItems: items });
    }
  } catch (err) {
    console.log(err);
  }
});

//get method to render about page
app.get("/about", function (req, res) {
  res.render("about");
});

//get method to load our dynamic list
app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  //checking if our list is already existing with given name or not 
  try {
    const findList = await List.findOne({ name: customListName });
    if (findList === null) {
      //create a new list with given name
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
    } else {
      //render an existing list
      res.render("list", { listTitle: findList.name, newListItems: findList.items })
    }
  } catch (err) {
    console.log(err);
  }
});

//post method when new item is added to list
app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const day = date.getDate();

  const newItem = new Item({
    name: itemName
  });

  if (listName == day) {
    newItem.save();
    res.redirect("/");
  } else {
    const foundList = await List.findOne({ name: listName });
    foundList.items.push(newItem);
    foundList.save();
    res.redirect("/" + listName);
  }
});

//post method for deleting an item when checked 
app.post("/delete", async function (req, res) {
  const checkedID = req.body.checkbox;
  const listName = req.body.listName;
  const day = date.getDate();

  if (listName == day) {
    await Item.findByIdAndRemove(checkedID);
    // console.log("Successfully deleted checked item.");
    res.redirect("/");
  } else {
    await List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedID}}});
    res.redirect("/" + listName);
  }
});

app.listen(port, function() {
  console.log(`Server started on port ${port}`);
});
