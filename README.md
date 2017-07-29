# email-weather
Send weather forecast by mail each day at 6am.

You need to create a `config.json` file with the following informations:
```json
{
	"key": "s2piFr2T56ZZR6zQ",
	"state": "France",
	"city": "Strasbourg",
  "language": "en",
  "to_email": "cedced19@gmail.com",
  "gmail": {
    "email": "cedced19-bot@gmail.com",
    "password": "p@ssword"
  }
}
```

You need to get a **key from Wunderground** to get weather, and **a Gmail account** to send email.
