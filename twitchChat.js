const broadcasterLogin = config.broadcasterId;
const clientId = config.clientId;
const clientSecret = config.clientSecret;
let broadcasterId = '';
let accessToken = '';
let tokenType = {};

const authUrl = 'https://id.twitch.tv';
const apiUrl = 'https://api.twitch.tv';

const badgeData = {};

ComfyJS.onChat = (user, message, flags, self, extra) => {
    console.log(user, message, flags, extra);

    console.log(tokenType + ' ' + accessToken)

    let chatHtml = ''

    chatHtml += '<div class="chat ' + (flags.broadcaster === true ? "broadcaster " : "") + (flags.mod === true ? "moderator " : "") + (flags.subscriber === true ? "subscriber " : "") + 'user_admin user_mng color_0 ran_0 rans_3 ranr_1 on ">';
    chatHtml += '<p class="nick">';
    if (flags.broadcaster) {
        chatHtml += '<img src="https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/1" alt="" class="badge">';
    }
    if (flags.mod) {
        chatHtml += '<img src="https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1" alt="" class="badge">';
    }
    if (flags.vip) {
        chatHtml += '<img src="https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/3" alt="" class="badge">';
    }
    if (flags.customReward) {
        //커스텀 뱃지
    }
    if (flags.subscriber) {
        try {
            chatHtml += '<img src="' + badgeData[extra.userBadges.subscriber].image_url_4x + '" alt="" class="twitch badge_broadcaster badge">';
        } catch (e) {
            console.log(e);
        }
    }
    chatHtml += '<span class="name">' + user + '</span>';
    chatHtml += '<span class="dot"> : </span>';
    chatHtml += '</p>';

    console.log(extra)

    if (extra.messageEmotes === null) {
        chatHtml += '<p class="text">' + message + '</p>';
    } else {
        chatHtml += '<p class="text">'
        const stringReplacements = [];
        Object.entries(extra.messageEmotes).forEach(([id, positions]) => {
            // use only the first position to find out the emote key word
            const position = positions[0];
            const [start, end] = position.split("-");
            const stringToReplace = message.substring(
                parseInt(start, 10),
                parseInt(end, 10) + 1
            );

            stringReplacements.push({
                stringToReplace: stringToReplace,
                replacement: '<img class="emote" src="https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0">',
            });
        });
        const messageHTML = stringReplacements.reduce(
            (acc, {stringToReplace, replacement}) => {
                // obs browser doesn't seam to know about replaceAll
                return acc.split(stringToReplace).join(replacement);
            },
            message
        );
        chatHtml += messageHTML;
        chatHtml += '</p>';
    }
    chatHtml += '</div>';
    $('#chatList').append(chatHtml);
}

ComfyJS.Init(broadcasterLogin);

$(document).ready(function () {
    $.ajax({
        url: authUrl + '/oauth2/token',
        type: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: {
            'client_id': clientId,
            'client_secret': clientSecret,
            'grant_type': 'client_credentials'
        },
        success: function (result) {
            console.log("token")
            console.log(result)

            accessToken = result.access_token;
            tokenType = result.token_type;

            $.ajax({
                url: apiUrl + '/helix/search/channels?query=' + broadcasterLogin,
                type: 'GET',
                headers: {
                    'Client-Id': clientId,
                    'Authorization': 'Bearer ' + accessToken
                },
                success: function (result) {
                    console.log("channels")
                    console.log(result)

                    for (let i = 0 ; i < result.data.length ; i++){
                        if (result.data[i].broadcaster_login === broadcasterLogin)
                            broadcasterId =result.data[i].id;
                    }


                    $.ajax({
                        url: apiUrl + '/helix/chat/badges?broadcaster_id=' + broadcasterId,
                        type: 'GET',
                        headers: {
                            'Client-Id': clientId,
                            'Authorization': 'Bearer ' + accessToken
                        },
                        success: function (result) {
                            console.log("badges")
                            console.log(result)
                            try {
                                for (let i = 0; i < result.data[0].versions.length; i++) {
                                    badgeData[result.data[0].versions[i].id] = {
                                        'image_url_1x': result.data[0].versions[i].image_url_1x,
                                        'image_url_2x': result.data[0].versions[i].image_url_2x,
                                        'image_url_4x': result.data[0].versions[i].image_url_4x
                                    }
                                }
                            } catch (e) {
                                console.log(e);
                            }
                        },
                        error: function (error) {
                            console.log(error)
                        }
                    });
                },
                error: function (error) {
                    console.log(error)
                }
            });
        },
        error: function (error) {
            console.log('Error ${error} ')
        }
    });
});