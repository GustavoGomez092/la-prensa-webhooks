var express = require('express')
var bodyParser = require('body-parser')
var app = express()

const PORT = process.env.PORT || 3000

// middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.post('/', function (req, res) {
  console.log(req.body)
  res.end('OK 200')
})

app.listen(PORT, function () {
  console.log('Example app listening on port 3000!')
})
