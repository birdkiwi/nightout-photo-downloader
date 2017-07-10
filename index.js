const http = require('http');
const fs = require('fs');
const needle = require('needle');
const cheerio = require('cheerio');
const prompt = require('prompt');

let URL;
let folderName;

function download(url, dest, callback) {
    let file = fs.createWriteStream(dest);
    let request = http.get(url, function (response) {
        response.pipe(file);
        file.on('finish', function () {
            file.close(callback); // close() is async, call callback after close completes.
        });
        file.on('error', function (err) {
            fs.unlink(dest); // Delete the file async. (But we don't check the result)
            if (callback)
                callback(err.message);
        });
    });
}

const promptSchema = {
    properties: {
        'URL': {
            description: 'Please, paste page url',
            required: true
        },
        'folderName': {
            description: 'Please, enter folder name',
            required: true
        }
    }
};

prompt.get(promptSchema, function (err, result) {
    URL = result.URL;
    folderName = result.folderName;

    if (!fs.existsSync('./downloads/' + folderName)) {
        fs.mkdirSync('./downloads/' + folderName);
    }

    needle.get(URL, function(err, res){
        if (err) throw err;
        console.log('Page read successfully: ' + res.statusCode);
        console.log();

        let photos = [],
            $ = cheerio.load(res.body);

        $('[data-fancybox-href]').each(function() {
            photos.push($(this).data('fancybox-href'));
        });

        console.log('Found ' + photos.length + ' photos');

        photos.forEach(function (photoUrl) {
            const filename = photoUrl.split('/').pop();
            download(photoUrl, './downloads/' + folderName + '/' + filename, function () {
                console.log('File ' + photoUrl + ' downloaded');
            })
        });
    });
});

