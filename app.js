const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://admin-sasha:MDBTest123@cluster0.ng3xsjn.mongodb.net/todolistDB');

const itemsSchema = {
  name: String
};

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: 'Welcome to your todo list'
});

const item2 = new Item({
  name: 'Hit the + button to add a new item'
});

const item3 = new Item({
  name: '<-- Hit this to cross off an item'
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model('List', listSchema);

app.get("/", function(req, res) {

  Item.find({}).then(function(foundItems) {
    if (foundItems.length == 0) {
      Item.insertMany(defaultItems).then(function() {
        console.log('Successfully added ' + defaultItems.length + ' default items to db.');
      }).catch(function(err) {
        console.log(err);
      });

      res.redirect('/');
    } else {
      res.render("list", {listTitle: 'Today', newListItems: foundItems});
    }
  }).catch(function(err) {
    console.log(err);
  });

});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}).then(function(foundList) {
    if(! foundList) {
      // create new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });
    
      list.save().then(function() {
        res.redirect('/' + customListName);
      }).catch(function(err) {
        console.log(err);
      });
      
    } else {
      // show existing list
      res.render('list', {listTitle: foundList.name, newListItems: foundList.items});
    }
  }).catch(function(err) {
    console.log(err);
  });

});


app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === 'Today') {
    item.save().then(function() {
      res.redirect('/');
    }).catch(function(err) {
      console.log(err);
    });
    
  } else {
    List.findOne({name: listName}).then(function(foundList) {
      foundList.items.push(item);
      foundList.save().then(function() {
        res.redirect('/' + listName);
      }).catch(function(err) {
        console.log(err);
      });
      
    }).catch(function(err) {
      console.log(err);
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today') {
    Item.findByIdAndRemove(checkedItemId).then(function() {
      console.log("Successfully removed item.");
    }).catch(function(err) {
      console.log(err);
    });
  
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(function() {
      res.redirect('/' + listName);
    }).catch(function(err) {
      console.log(err);
    });
  }
});

app.get("/work", function(req,res) {
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res) {
  res.render("about");
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
