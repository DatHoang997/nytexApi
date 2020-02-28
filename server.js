const express = require('express')
const app = express()
const port = 8880
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dataRoute = require('./routes/data.route')


mongoose.connect('mongodb://localhost:27017/mydb', { useNewUrlParser: true, useUnifiedTopology: true });


app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.set('view engine', 'pug')
app.set('views', './views')

app.use('/', dataRoute)



app.listen(port, () => console.log(`Example app listening on port ${port}!`))