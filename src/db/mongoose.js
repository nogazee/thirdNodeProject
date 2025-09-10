const mongoose = require('mongoose');

const connectionURL = 'mongodb+srv://nogze25_db_user:SOHwvRdPrci4R48x@cluster0.x2oj1km.mongodb.net/artech-api';
mongoose.connect(connectionURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
