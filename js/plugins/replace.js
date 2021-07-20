function replaceStyle(message) {
    //외부 이미지 문법
    //~이미지 켜기 혹은 설정 변수 변경으로 활성화
    if(window.config.allowExternalSource) {
        var image = message.match(/\[img ([^\]\"]*)\]/);
        if(image !== null && typeof image[1] !== 'undefined') {
            var attr = {};
            attr.class = "extimg";
            message = ReferrerKiller.imageHtml(image[1], attr, attr);
        }

        // 나머지 외부 이미지 문법은 모두 삭제
        message = message.replace(/\[img ([^\]\"]*)\]/gi, "");

        // 외부이미지 사용시 이외 문자는 지워짐으로 변환할 이유 없음
        return message;
    }

    //닫는태그가 지정된 [b][i][s]
    message = message.replace(/\[b\](.*)\[\/b\]/gi, "<b>$1</b>"); //볼드 [b]blah[/b]
    message = message.replace(/\[i\](.*)\[\/i\]/gi, "<i>$1</i>"); //이탤릭 [i]blah[/i]
    message = message.replace(/\[s\](.*)\[\/s\]/gi, "<strike>$1</strike>"); //취소선 [s]blahp[/s]

    // 나무위키식
    message = message.replace(/'''(.*)'''/gi, "<b>$1</b>");
    message = message.replace(/''(.*)''/gi, "<i>$1</i>");
    message = message.replace(/~~(.*)~~/gi, "<strike>$1</strike>");
    message = message.replace(/--(.*)--/gi, "<strike>$1</strike>");
    message = message.replace(/__(.*)__/gi, "<u>$1</u>");

    //닫는 태그가 없는 [b][i][s]
    message = message.replace(/\[b\](.*)/gi, "<b>$1</b>"); //볼드 [b]blah
    message = message.replace(/\[i\](.*)/gi, "<i>$1</i>"); //이탤릭 [i]blah
    message = message.replace(/\[s\](.*)/gi, "<strike>$1</strike>"); //취소선 [s]blah

    //강제개행
    message = message.replace(/\[br\]/gi, "<br />");

    //움짤구독티콘

    return message;
}




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