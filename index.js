const { Analytics } = require('analytics')
const googleAnalytics = require('@analytics/google-analytics').default
const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios').default
require('dotenv').config()
const app = express()
const crypto = require('crypto')

const PORT = process.env.PORT || 3000

const { API_TOKEN, PRIVATE_KEY, GOOGLE_ANALYTICS_ID, CAMPAIGN_NAME, ENV } = process.env

// Set up Google Analytics
const analytics = Analytics({
  app: 'La Prensa Sandbox',
  version: 100,
  plugins: [
    googleAnalytics({
      trackingId: GOOGLE_ANALYTICS_ID
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

app.get('/conversions', function (req, res) {
  res.status(200)
  console.log('Incoming lead')
  const responseOpject = JSON.parse(decrypt(keystring, req.query.data))
  // Make a request for a user with a given ID
  axios.get(`${ENV === 'development' ? 'https://sandbox.tinypass.com/api/v3' : 'https://api.tinypass.com/api/v3'}/publisher/conversion/get`, {
    params: {
      api_token: API_TOKEN,
      aid: responseOpject.aid,
      access_id: responseOpject.access_id
    }
  })
    .then(function (response) {
      // handle success
      // console.log(response.data)
      analytics.track(responseOpject.event, {
        category: response.data.conversion.term.name,
        value: response.data.conversion.user_payment.amount,
        label: CAMPAIGN_NAME
      })
      analytics.identify(response.data.conversion.user_access.user.email, {
        firstName: response.data.conversion.user_access.user.first_name,
        lastName: response.data.conversion.user_access.user.last_name
      })
    })
    .catch(function (error) {
      // handle error
      console.log(error)
      res.sendStatus(500)
      res.status(500).end('server error')
    })
  res.statusMessage = '200 OK'
  res.status(200).end()
})

app.post('/conversions', function (req, res) {
  res.status(200)
  console.log('Incoming lead')
  const responseOpject = JSON.parse(decrypt(keystring, req.query.data))
  // Make a request for a user with a given ID
  axios.get(`${ENV === 'development' ? 'https://sandbox.tinypass.com/api/v3' : 'https://api.tinypass.com/api/v3'}/publisher/conversion/get`, {
    params: {
      api_token: API_TOKEN,
      aid: responseOpject.aid,
      access_id: responseOpject.access_id
    }
  })
    .then(function (response) {
      // handle success
      // console.log(response.data)
      analytics.track(responseOpject.event, {
        category: response.data.conversion.term.name,
        value: response.data.conversion.user_payment.amount,
        label: CAMPAIGN_NAME
      })
      analytics.identify(response.data.conversion.user_access.user.email, {
        firstName: response.data.conversion.user_access.user.first_name,
        lastName: response.data.conversion.user_access.user.last_name
      })
    })
    .catch(function (error) {
      // handle error
      console.log(error)
      res.sendStatus(500)
      res.status(500).end('server error')
    })
  res.statusMessage = '200 OK'
  res.status(200).end()
})

app.listen(PORT, function () {
  console.log(`app listening on port ${PORT}!`)
})
