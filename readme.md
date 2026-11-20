For authentication: Passport local with Session
For JWT Authorization: JWT tokens with cookies
Used connect-flash to retain allows the server to store temporary messages ina session and display them after redirecting. This was used in my task controller to send the notification to the front end.
used app.set('trust proxy', 1); as a middle ware to trust the https render proxy when accessing my node application.