const { Analytics } = require('analytics')
const googleAnalytics = require('@analytics/google-analytics').default
const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios').default
require('dotenv').config()
const app = express()
const crypto = require('crypto')

const PORT = process.env.PORT || 3000

const { API_TOKEN, PRIVATE_KEY } = process.env

// Set up Google Analytics
const analytics = Analytics({
  app: 'La Prensa Sandbox',
  version: 100,
  plugins: [
    googleAnalytics({
      trackingId: 'UA-161812465-1'
    })
  ]
})

// Data decoder
const keystring = PRIVATE_KEY

function urldesafe (data) {
  const newData = data.replace('-_', '+/')
  return newData
}

function sslDecrypt (keystring, str) {
  var mykey = crypto.createDecipheriv('aes-256-ecb', keystring, '')
  mykey.setAutoPadding(false)
  var mystr = mykey.update(str, 'base64', 'utf8')
  mystr += mykey.final('utf8')
  return mystr
}

function decrypt (keyString, data) {
  const pos = data.lastIndexOf('~~~')
  if (pos > 0) {
    data = data.substr(0, pos)
  }

  data = urldesafe(data)
  if (keyString.length > 32) {
    keyString = keyString.substr(0, 32)
  }

  if (keyString.length < 32) {
    keyString = keyString.padStart(32, 'X')
  }
  function encodeUtf8 (s) {
    return s.replace(/("}).*/g, '"}')
  }

  const mystring = encodeUtf8(sslDecrypt(keyString, data))
  return mystring
}

// middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', function (req, res) {
  const responseOpject = JSON.parse(decrypt(keystring, req.query.data))
  // Make a request for a user with a given ID
  axios.get('https://sandbox.tinypass.com/api/v3/publisher/conversion/get', {
    params: {
      api_token: API_TOKEN,
      aid: responseOpject.aid,
      access_id: responseOpject.access_id
    }
  })
    .then(function (response) {
      // handle success
      // console.log(response.data)
      console.log({
        action: responseOpject.event,
        category: response.data.conversion.term.name,
        value: response.data.conversion.user_payment.amount,
        label: 'Top Floor Marketing Campaign'
      })
      analytics.track(responseOpject.event, {
        category: response.data.conversion.term.name,
        value: response.data.conversion.user_payment.amount,
        label: 'Top Floor Marketing Campaign'
      })
      analytics.identify(response.data.conversion.user_access.user.email, {
        firstName: response.data.conversion.user_access.user.first_name,
        lastName: response.data.conversion.user_access.user.last_name
      })
      res.status(200).end('OK 200')
    })
    .catch(function (error) {
      // handle error
      console.log(error)
    })
})

app.listen(PORT, function () {
  console.log('Example app listening on port 3000!')
})
