const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Calendar API.
  authorize(JSON.parse(content), addEvents);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
// function listEvents(auth) {
//   const calendar = google.calendar({version: 'v3', auth});
//   calendar.events.list({
//     calendarId: 'primary',
//     timeMin: (new Date()).toISOString(),
//     // timeMin: (new Date(Date.parse("2018-01-22"))).toISOString(),
//     // timeMax: (new Date(Date.parse("2018-08-27"))).toISOString(),
//     maxResults: 10,
//     singleEvents: true,
//     orderBy: 'startTime',
//   }, (err, res) => {
//     if (err) return console.log('The API returned an error: ' + err);
//     const events = res.data.items;
//     if (events.length) {
//       console.log('Upcoming 10 events:');
//       events.map((event, i) => {
//         const start = event.start.dateTime || event.start.date;
//         console.log(`${start} - ${event.summary}`);
//       });
//     } else {
//       console.log('No upcoming events found.');
//     }
//   });
// }



function addEvents(auth) {
  const request = require('request');
  const calendar = google.calendar({version: 'v3', auth});  
  // const copy = [];
  const options = {  
      url: 'https://itops.chattanooga.gov/rest/api/latest/search?maxResults=100&jql=issuetype%20%3D%20Change%20AND%20status%20%3D%20"Waiting%20for%20Approval"',
      method: 'GET',
      auth: {
          username: 'rrios',
          password: 'Fall2018!'
      }
  };
  
  request(options, function(err, res, body) {  
    let json = JSON.parse(body);
    const items = json.issues;
    console.log(items.length);
    const delay = (amount = number) => {
      return new Promise((resolve) => {
        setTimeout(resolve, amount);
      });
    }
    async function loop() {
      for (let i = 0; i < items.length; i++) {
        console.log(i);
        console.log(items[i].fields.summary);
      updated = items[i].fields.updated.split("T")[0]
      var dateNow = new Date();
      var dd = dateNow.getDate().toString();
      var monthSingleDigit = dateNow.getMonth() + 1,
            mm = monthSingleDigit < 10 ? '0' + monthSingleDigit : monthSingleDigit;
        var yy = dateNow.getFullYear().toString();
      var today = yy.concat("-").concat(mm).concat("-").concat(dd)
      status = items[i].fields.status.name;
      updated = items[i].fields.updated.split("T")[0]
      schedule = items[i].fields.customfield_10310.split("T")[0]
      if (status == "Waiting for Approval" && updated == today){
        schedule = items[i].fields.customfield_10310.split("T")[0]
        var event = {
          'summary': items[i].fields.summary,
          'location': '800 Howard St., San Francisco, CA 94103',
          'description': items[i].fields.description,
          'start': {
            'date': schedule,
            'timeZone': 'America/New_York',
          },
          'end': {
            'date': schedule,
            'timeZone': 'America/New_York',
          },
          // 'recurrence': [
          //   'RRULE:FREQ=DAILY;COUNT=2'
          // ],
          'attendees': [
            {'email': 'lpage@example.com'},
            {'email': 'sbrin@example.com'},
          ],
          'reminders': {
            'useDefault': false,
            'overrides': [
              {'method': 'email', 'minutes': 24 * 60},
              {'method': 'popup', 'minutes': 10},
            ],
          },
        };
      
        calendar.events.insert({
          auth: auth,
          calendarId: 'primary',
          resource: event,
        }, function(err, event) {
          if (err) {
            console.log('There was an error contacting the Calendar service: ' + err);
            return;
          }
          console.log('Event created: %s', event.htmlLink);
        });
      }    
    // });
    await delay(1000);
    }
    }
    loop();
  });
}
