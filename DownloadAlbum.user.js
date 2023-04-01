// ==UserScript==
// @name        Bandcamp Download Album
// @namespace   https://bandcamp.com
// @match       https://bandcamp.com/download*
// @description Downloads the item from the download page. Refreshes if there is an error.
// @author      Ryan Bluth, Xerus2000, chy
// @version     1.2
// @grant       none
// ==/UserScript==

(function () {
    'use strict';

    // Set preferred download format here
    var format = "flac";
    // Whether the download tab should automatically be closed after the download has been started
    var closeAfterDownload = true;

    var selectedFormat = false;
    setTimeout(function () {
        var interval = setInterval(function () {
            if (!selectedFormat) {
                var dlFormatSelectionChoices = getDownloadOptionsButton()
                var options = availableFormats(dlFormatSelectionChoices)

                var isFormatAvailable = options.includes(format)
                if (!isFormatAvailable) {
                    throw new Error(`Formatw ${format} did not match options ${options}`)
                }
                dlFormatSelectionChoices.value = format
                selectedFormat = true;
            } else {
                waitDownloadReady();
                var downloaded = downloadAlbum();
                if (downloaded) {
                    close();
                }
                var errorText = document.getElementsByClassName('error-text')[0];
                if (errorText.offsetParent !== null) {
                    location.reload();
                }

                try {
                    var maintenanceLink = document.getElementsByTagName('a')[0];
                    if (maintenanceLink.href.indexOf("bandcampstatus") > 0) {
                        location.reload();
                    }
                } catch (e) {
                    console.log(e);
                }

                var titleLabel = document.getElementsByClassName('download-title')[0];
                if (titleLabel.children[0].href !== undefined && titleLabel.children[0].href.length > 0) {
                    window.open(titleLabel.children[0].href);
                    clearTimeout(interval);
                    if (closeAfterDownload) {
                        close();
                    }
                }
            }
        }, 4000);
    }, 4000);
})();


function getDownloadOptionsButton() {
    var availableFormatsButtons = document.getElementsByClassName('bc-select select-margins')
    if (availableFormatsButtons.length === 0) {
        throw new Error('Did not find download button')
    }
    if (availableFormatsButtons.length > 1) {
        throw new Error('Error, found multiple download button', availableFormatsButtons)
    }
    return availableFormatsButtons[0]
};

function availableFormats(availableFormatsButton) {
    var HTMLoptions = availableFormatsButton.options
    // HTMLoptions doesn't have map as a builtin method
    return Array.prototype.map.call(HTMLoptions, (opt) => opt.value)
};

function waitDownloadReady() {
    var ready = false;
    var retryingAttemp = 10;
    var waitForReady = setInterval(function () {
        while (!ready || retryingAttemp) {
            // Check if the preparing div is visible
            var element = document.getElementsByClassName('preparing-wrapper')[0]
            ready = element.style["display"] == "none";
            if (ready) {
                clearInterval(waitForReady);
                break;
            }
            retryingAttemp -= 1;
            if (retryingAttemp == 0) {
                // Could not download
                window.location.reload();
            }
            console.log("Download not ready yet")
        };
        console.log('Download ready');
    }, 1000)
};

function downloadAlbum() {
    var downloadLink = document.querySelectorAll('.download-format-tmp > a')[0].href;
    if (!downloadLink.includes('bcbits.com')) {
         return false
    } else {
        window.open(downloadLink);
        return true;
    }
};
