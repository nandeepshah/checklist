require('dotenv').config(); //enables us to use enviorenmental variables
const express = require('express');
const app = express();
const path = require('path');
const { logger, logEvents } = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const connectDB = require('./config/dbConn');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 3500;
connectDB();
app.use(logger); //custom middleware that logs requests and errors
app.use(cors(corsOptions)); //middleware that checks cors origins
app.use(express.json()); //lets server parse json
app.use(cookieParser()); //lets server parse cookies
app.use('/', express.static(path.join(__dirname, 'public'))); //sends static files
app.use('/', require('./routes/root')); //sends the index.html page when we go to root localhost:3500

//sends a 404 after all middleware didnt catch the request
app.all('*', (req, res) => {
	res.status(404);
	if (req.accepts('html')) {
		res.sendFile(path.join(__dirname, 'views', '404.html'));
	} else if (req.accepts('json')) {
		res.json({ message: '404 not found' });
	} else {
		res.type('txt').send('404 not found');
	}
});

app.use(errorHandler);

mongoose.connection.once('open', () => {
	console.log('Connected to MongoDB');
	app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

mongoose.connection.on('error', err => {
	console.log(err);
	logEvents(
		`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
		'mongoErrLog.log'
	);
});
