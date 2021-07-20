(function(window) {
	var plugin_name = "block";

	if (typeof window.ChatAssistX.plugins[plugin_name] !== 'undefined') {
		console.log(plugin_name.capFirst() + " plugin is already loaded!");
/**
 * 메세지의 마퀴태그 문법 파싱후 <marquee> 태그 반환
 * @param {String} match
 * @param {String} direction
 * @param {String} behavior
 * @param {String} loop
 * @param {String} scrollamount
 * @param {String} scrolldelay
 * @param {String} body
 * @param {String} offset
 *
 * @returns {String}
 */
function replaceMarquee(match, direction, behavior, loop, scrollamount, scrolldelay, body, offset) {
    // 빈 값 확인
    if(typeof direction == "undefined") direction = "";
    if(typeof behavior == "undefined") behavior = "";
    if(typeof loop == "undefined") loop = "";
    if(typeof scrollamount == "undefined") scrollamount = "";
    if(typeof scrolldelay == "undefined") scrolldelay = "";

    // 내용이 빈 mq 태그는 무의미하므로 리턴
    if(typeof body == "undefined") return "";

    var scrollamount_value = scrollamount.replace(/[^0-9]/g, "");

    // scrollamount 값을 50 이하로 제한함(50이 넘으면 50으로 강제 하향조정)
    if(scrollamount_value > 50) scrollamount = ' scrollamount=50';

    // 마퀴태그내 이모티콘이 오면 마퀴태그를 무시함
    if(window.emoticon.isActive && window.config.allowEmoticon && window.config.ignoreMQEmoticon) {
        // 우선 마퀴태그 내 이모티콘을 변환해봄
        body = body.replace(/~([^\ ~]*)/gi, replaceEmoticon);
        // 이모티콘이 있다면 그냥 마퀴태그 없이 변환된 이모티콘 이미지만 반환
        if(body.match(/<img/) != null) return body;
    }

    // 마퀴태그 만들어 반환
    return '<marquee' + direction + behavior + loop + scrollamount + scrolldelay + '>' + body + '</marquee>';
}

/**
 * 이모티콘 변환 함수
 * @param {String} match
 * @param {String} emoticon_key
 * @param {String} offset
 * @returns {String}
 */
function replaceEmoticon(match, emoticon_key, offset) {
    var emoticon = window.emoticon.list;
    emoticon_key = emoticon_key.toLowerCase();

    // 이모티콘이 없다면 그냥 반환함
    if(typeof emoticon[emoticon_key] == "undefined") {
        return match;
    } else {
        return "<img src=\"" + emoticon[emoticon_key] + "\" >";
    }
}

function TAPIC_replaceTwitchEmoticon(message, emotes) {
    var ranges;
    var id;
    var emote_id;
    var regExp;
    var replace_list = {};

    if(typeof emotes != 'undefined') {
        var emote_list = emotes.split("/");
        emote_list.forEach(function(emote_replace) {
            ranges = emote_replace.split(":");
            id = ranges[0];
            if(typeof ranges[1] == 'undefined') return;
            ranges = ranges[1].split(",");
            if(typeof ranges[0] != 'undefined') {
                ranges = ranges[0].split("-");
                emote_id = message.substring(parseInt(ranges[0]), parseInt(ranges[1]) + 1);
                replace_list[emote_id] = id;
            }
        });

        for(var replace_id in replace_list) {
            regExp = new RegExp(replace_id.escapeRegExp(), "g");
            // message = message.replace(regExp, "<img class=\"twitch_emoticon\" src=\"https://static-cdn.jtvnw.net/emoticons/v1/" + replace_list[replace_id] + "/" + window.config.TwitchEmoticonsize + "\" >");
            message = message.replace(regExp, "<img class=\"twitch_emoticon\" src=\"https://static-cdn.jtvnw.net/emoticons/v1/" + replace_list[replace_id] + "/" + "2.0" + "\" >");
        }
    }

    return message;
}

/**
 * 명령어 변환 함수
 * @param {String} match
 * @param {String} command
 * @param {String} commandarg
 * @param {String} offset
 * @returns {String}
 */
function replaceCommand(match, command, commandarg, offset) {
    var message = "";
    console.log(command);

    switch (command) {
        case "채팅초기화":
            $(".chat_container").html("");
            break;
        case "이미지":
            message = commandarg.replace("~이미지", "");
            message = message.split(" ");
            if(typeof message[0] === 'undefined') return match;
            if(message[0] === "켜기" || message[0] === "활성화" || message[0] === "온") {
                window.config.allowExternalSource = true;
                message = "외부 이미지 문법이 켜졌습니다.";
            }
            if(message[0] === "끄기" || message[0] === "비활성화" || message[0] === "오프") {
                window.config.allowExternalSource = false;
                message = "외부 이미지 문법이 꺼졌습니다.";
            }

            // 고정 메세지로 출력
            addChatMessage("warning", "설정 변경 알림", message, true, false);
            break;
        case window.verb.emoticon:
            message = commandarg.replace("~" + window.verb.emoticon, "");
            message = message.split(" ");
            if(typeof message[0] === 'undefined') return match;
            if(message[0] === "켜기" || message[0] === "활성화" || message[0] === "온") {
                window.config.allowEmoticon = true;
                message = window.verb.emoticon + "이 켜졌습니다.";
            }
            if(message[0] === "끄기" || message[0] === "비활성화" || message[0] === "오프") {
                window.config.allowEmoticon = false;
                message = window.verb.emoticon + "이 꺼졌습니다.";
            }
            // 고정 메세지로 출력
            addChatMessage("warning", "설정 변경 알림", message, true, false);
            break;
        default:
            return match;
    }

}
