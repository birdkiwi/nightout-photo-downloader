const http = require('http');
const fs = require('fs');
const needle = require('needle');
const cheerio = require('cheerio');
const prompt = require('prompt');
const electron = require('electron');
const remote = electron.remote;
const mainProcess = remote.require('./index');

let URL;
let folderName;

const logArea = document.getElementById('logArea');

function log(text) {
    logArea.value = logArea.value + '\n' + text;
    logArea.scrollTop = logArea.scrollHeight;
}

document.getElementById('urlInput').addEventListener('change', _ => {
    URL = document.getElementById('urlInput').value;
});

document.getElementById('folderButton').addEventListener('click', _ => {
    document.getElementById('folderInput').click()
});

document.getElementById('folderInput').addEventListener('click', _ => {
    let selectedFolderArr = mainProcess.selectDirectory();
    if (selectedFolderArr) {
        folderName = selectedFolderArr[0];
        document.getElementById('folderPath').innerHTML = folderName;
    }
});

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

document.getElementById('submitButton').addEventListener('click', function () {
    if (URL && folderName) {
        needle.get(URL, function(err, res){
            if (err) throw err;
            log('Page read successfully: ' + res.statusCode);

            let photos = [],
                $ = cheerio.load(res.body);

            $('[data-fancybox-href]').each(function() {
                photos.push($(this).data('fancybox-href'));
            });

            alert('Найдено ' + photos.length + ' фотографий');

            photos.forEach(function (photoUrl, i) {
                const filename = photoUrl.split('/').pop();
                download(photoUrl, folderName + '/' + filename, function () {
                    log('File #' + i + ': ' + photoUrl + ' downloaded');
                });
            });
        });
    } else {
        if (!URL) {
            alert('Введите ссылку!');
        }
        if (!folderName) {
            alert('Выберите папку для скачивания!');
        }
    }
});
