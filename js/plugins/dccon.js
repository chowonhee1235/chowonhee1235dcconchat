// 용어 설정 가져옴
window.verb = (typeof window.verb !== 'undefined') ? window.verb : {};

window.def_verb = {};
window.def_verb.emoticon = "디시콘";

// 가져온 용어중 빠진 값은 기본값으로 지정
for(var key in window.def_verb) {
    if(typeof window.verb[key] === 'undefined') window.verb[key] = window.def_verb[key];
}

// 익명화 관련 내용
window.anon = {};
window.anon.nickdb = {};

if(typeof window.config.channelname === 'undefined') {
    if(typeof window.tapic !== 'undefined' && typeof window.tapic.channelname !== 'undefined') {
        window.config.channelname = window.tapic.channelname;
    } else {
        window.config.channelname = "funzinnu";
    }
}

// XMLHTTPRequest
var httpRequest;

/**
 * 채팅 템플릿 컴파일
 * @returns void
 */
function CompileChat() {
    Handlebars.registerHelper('ifCond', function(v1, v2, options) {
        if(v1 === v2) {
            return options.fn(this);
        }
        return options.inverse(this);
    });

    var source = $("#chat-template").html();
    window.chat.template = Handlebars.compile(source);
    source = $("#chat-template-sticky").html();
    window.chat.stickytemplate = Handlebars.compile(source);
}

/**
 * 임의 문자열을 반환하는 함수
 * @returns String
 */
function genID(type, length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    var i;
    if(type == "string") {
        for(i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
    } else {
        for(i = 0; i < length; i++) {
            result += (Math.floor(Math.random() * 9) + 1).toString();
        }
    }
    return result;
}

/**
 * 정규식 특수문자 이스케이프 함수
 * @returns {String}
 */
String.prototype.escapeRegExp = function() {
    return this.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

/**
 * HTML 필터링
 * @returns {String}
 */
String.prototype.htmlEntities = function() {
    return String(this).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/&amp;gt/g, '&gt').replace(/&amp;lt/g, '&lt');
};

/**
 * 이모티콘 JSON 불러옴
 * @returns {Boolean}
 */
function LoadEmoticon() {
    if(window.emoticon.address === "") {
        connect_twitch();
        return true;
    }
    
    // BridgeBBCC 호환 이모티콘 목록은 script 태그를 사용해서 불러옴
    if(window.emoticon.address.split('.').pop() != "php") {
        var emoticon_js = document.createElement("script");
        emoticon_js.type = "text/javascript";
        emoticon_js.charset = "utf-8";
        emoticon_js.src = window.emoticon.address + "?ts=" + new Date().getTime();
        document.body.appendChild(emoticon_js);
    
        emoticon_js.onload = function() {
            if(!window.emoticon.isActive) {
                if (dcConsData.length == 0) {
                    addChatMessage("error", window.verb.emoticon + " 초기화 오류", window.verb.emoticon + " 리스트를 불러올 수 없습니다.", true, false);
                }
            
                addChatMessage("info", "불러오는중", window.verb.emoticon + " 목록 파싱중...", true, false);
                for(var index in dcConsData) {
                    var keywords = dcConsData[index].keywords;
                    for(var index2 in keywords) {
                        if(typeof dcConsData[index].uri === 'undefined') {
                            window.emoticon.list[keywords[index2]] = window.emoticon.address.replace(/[^\/]+\.js$/, "images/") + encodeURIComponent(dcConsData[index].name);
                        } else {
                            window.emoticon.list[keywords[index2]] = dcConsData[index].uri;
                        }
                    }
                }
                
                window.emoticon.isActive = true;
                window.emoticon.istwitchActive = true;
                addChatMessage("info", "불러오는중", window.verb.emoticon + " 목록을 불러왔습니다.", true, false);
                connect_twitch();
            }
        }
        
        return true;
    } else {
        httpRequest = new XMLHttpRequest();
        if(!httpRequest) {
            addChatMessage("error", window.verb.emoticon + " 초기화 오류", "XMLHTTPRequest를 초기화할수 없었습니다.", true, false);
            return false;
        }
        
        addChatMessage("info", "불러오는중", window.verb.emoticon + " 목록을 불러오는중...", true, false);
        
        httpRequest.open('GET', window.emoticon.address);
        httpRequest.onreadystatechange = CompleteLoadEmoticon;
        httpRequest.send();

        return true;
    }
}

/**
 * 불러온 이모티콘 JS/JSON 파일 파싱 후 배열에 저장
 * @returns void
 */
function CompleteLoadEmoticon() {
    if(httpRequest.readyState === 4) {
        if(httpRequest.status === 200) {
            try {
                window.chat.emoticonfailcount = 0;
                addChatMessage("info", "업그레이드 경고", "<span style='color:red;'>1.9.0.0 버전부터 예전 스타일 " + window.verb.emoticon + " 목록 지원이 중단됩니다.</span>", true, false);
                window.emoticon.list = JSON.parse(httpRequest.responseText);
                window.emoticon.isActive = true;
                window.emoticon.istwitchActive = true;
                addChatMessage("info", "불러오는중", window.verb.emoticon + " 목록을 불러왔습니다.", true, false);
                connect_twitch();
            } catch (e) {
                window.chat.emoticonfailcount++;
                if(window.chat.emoticonfailcount > 10) {
                    addChatMessage("error", window.verb.emoticon + " 초기화 오류", window.verb.emoticon + " JSON 파싱중 오류가 발생했습니다.", true, false);
                    window.chat.emoticonfailcount = 0;
                    window.emoticon.list = [];
                    window.emoticon.isActive = false;
                    window.emoticon.istwitchActive = true;
                    addChatMessage("error", "불러오는중", window.verb.emoticon + " 초기화 오류로 비활성화됩니다.", true, false);
                    connect_twitch();
                } else {
                    setTimeout(LoadEmoticon, 1000);
                }
            }
        } else {
            window.chat.emoticonfailcount++;
            if(window.chat.emoticonfailcount > 10) {
                addChatMessage("error", window.verb.emoticon + " 초기화 오류", window.verb.emoticon + " JSON 다운로드중 오류가 발생했습니다.", true, false);
                window.chat.emoticonfailcount = 0;
                window.emoticon.list = [];
                window.emoticon.isActive = false;
                window.emoticon.istwitchActive = true;
                addChatMessage("error", "불러오는중", window.verb.emoticon + " 초기화 오류로 비활성화됩니다.", true, false);
                connect_twitch();
            } else {
                setTimeout(LoadEmoticon, 1000);
            }
        }
    }
}

/**

    return "COMMAND_DO_NOT_PRINT";
}

/**
 * 채팅 스타일 반영
 * @returns void
 */
function updateStyle() {
    $(".chat_text_nickname").css({
        'font-family': window.chat.config.font,
        'font-size': window.chat.config.fontUsernameSize,
        "color": "rgb(" + window.chat.config.fontUsernameColor + ")"
    });
    $(".chat_text_message").css({
        'font-family': window.chat.config.font,
        'font-size': window.chat.config.fontChatSize,
        "color": "rgb(" + window.chat.config.fontChatColor + ")",
        "background-color": "rgba(" + window.chat.config.chatBackgroundColor + "," + (window.chat.config.chatBackgroundAlpha * 0.01) + ")"
    });
    $("body").css("background", "rgba(" + window.chat.config.backgroundColor + "," + (window.chat.config.backgroundAlpha * 0.01) + ")");
}

/**
 * 봇 채팅 필터링 함수
 * 필터링 대상 닉네임이면 true 반환
 * @param {String} nickname
 * @returns {Boolean}
 */
function filterNick(nickname) {
    //BUGFIX 필터링 닉네임이 비어있으면 채팅이 뜨지 않는 문제 수정
    if(window.config.ignoreNickname === '') return false;
    var list = window.config.ignoreNickname.split(",");

    if(list.indexOf(nickname.toLowerCase()) != -1) return true;
    else return false;
}

/**
 * 스트리머 닉네임 여부를 판단하는 함수
 * [DEPRECATED] this function always return false
 * @param {String} nickname
 * @returns {Boolean}
 */
function isStreamer(platform, nickname) {
    return false;
}

/**
 * 채팅메세지 추가 함수
 * @param {String} platform
 * @param {String} nickname
 * @param {String} message
 * @param {Boolean} sticky
 * @param {Boolean} ext_args
 * @returns {String}
 */
function addChatMessage(platform, nickname, message, sticky, ext_args) {
    var $chatElement;
    var $remove_temp;
    var chat;
    var rawprint = false;
    var message_regex;

    // 초기화 전엔 일반채팅은 무시하며 고정 채팅만 일반채팅으로 출력
    if(!window.chat.isInited) {
        if(!sticky) return;
        else sticky = false;
    }

    //이미 고정된 메세지가 있었다면 추가로 고정하지 않음
    if(window.chat.sticky && sticky) return;

    if(typeof ext_args === "boolean") {
        rawprint = ext_args;
        ext_args = {};
        ext_args.rawprint = rawprint;
        ext_args.isStreamer = false;
        ext_args.isMod = false;
    } else if(typeof ext_args === "object" && typeof ext_args.rawprint === "boolean") {
        rawprint = ext_args.rawprint;
    } else {
        console.error("ext_args format is wrong - expected object or boolean, got " + typeof ext_args);
        ext_args = {};
        ext_args.rawprint = rawprint;
        ext_args.isStreamer = false;
        ext_args.isMod = false;
    }

    if(rawprint) {
        // 강제개행 문법만 변환
        message = message.replace(/\[br\]/gi, "<br />");
    } else {
        if(filterNick(nickname)) return;

        // 플랫폼 아이콘 미사용시
        if(!window.chat.config.platformIcon) {
            platform = "none";
        }

        //기본문법 변환
        message = replaceStyle(message);

        // 금지어 치환
        for(var key in window.config.replace) {
            message_regex = new RegExp(key.escapeRegExp(), "gi");
            message = message.replace(message_regex, window.config.replace[key]);
        }

        // marquee 태그 변환
        message = message.replace(/\[mq( direction=[^\ ]*)?( behavior=[^\ ]*)?( loop=[^\ ]*)?( scrollamount=[^\ ]*)?( scrolldelay=[^\ ]*)?\](.*)\[\/mq\]/gi, replaceMarquee);

        // 메세지 안 이모티콘 변환(시동어 ~ 입력후 등록한 이모티콘 이름 입력하면 됨)
        if(window.emoticon.isActive && window.config.allowEmoticon) message = message.replace(/~([^\ ~]*)/gi, replaceEmoticon);

        // 메세지 안 트위치 이모티콘 변환
        message = TAPIC_replaceTwitchEmoticon(message, ext_args.emotes);

        // 모더레이터는 굵게
        if(ext_args.isMod) {
            nickname = "<b>" + nickname + "</b>";
        }

        // 스트리머 뱃지
        if(ext_args.isStreamer) {
            message = message.replace(/~([^ ]+)+(?: )*(.+)*/gi, replaceCommand);
            nickname = '<img style="vertical-align: middle;" src="http://funzinnu.cafe24.com/stream/cdn/b_broadcaster.png" alt="Broadcaster" class="badge">&nbsp;' + nickname;
        }

        if(window.config.anon && window.chat.isInited && !sticky) {
            if(typeof window.config.anon_nickname === 'undefined') {
                window.config.anon_nickname = "시청자";
            }

            nickname = window.config.anon_nickname;
            if(window.config.anon_random !== false) {
                if(typeof window.config.anon_random === 'undefined') {
                    window.config.anon_random = "string";
                }
                if(typeof window.config.random_length === 'undefined') {
                    window.config.random_length = 4;
                }
                if(typeof window.config.fix_random_id === 'undefined') {
                    window.config.fix_random_id = false;
                }

                var rand_id;
                if(window.config.fix_random_id) {
                    if(typeof window.anon.nickdb[ext_args.id] === 'undefined') {
                        window.anon.nickdb[ext_args.id] = {};
                        window.anon.nickdb[ext_args.id].type = window.config.anon_random;
                        window.anon.nickdb[ext_args.id].length = window.config.random_length;
                        window.anon.nickdb[ext_args.id].rand_id = genID(window.config.anon_random, window.config.random_length);
                    }

                    if(window.anon.nickdb[ext_args.id].type != window.config.anon_random || window.anon.nickdb[ext_args.id].length != window.config.random_length) {
                        window.anon.nickdb[ext_args.id].rand_id = genID(window.config.anon_random, window.config.random_length);
                    }

                    rand_id = window.anon.nickdb[ext_args.id].rand_id;
                } else {
                    rand_id = genID(window.config.anon_random, window.config.random_length);
                }

                nickname += " " + rand_id;
            }
        }

        // 명령어 입력은 화면에 표시하지 않음
        if(message.indexOf("COMMAND_DO_NOT_PRINT") != -1) return;
    }

    chat = {
        num: window.chat.cur_count,
        platform: platform,
        nickname: nickname,
        message: message,
        notitle: "NOTITLE"
    };
    $chatElement = sticky ? $(window.chat.stickytemplate(chat)) : $(window.chat.template(chat));
    $chatElement.appendTo($(".chat_container"));
    updateStyle();
    if(window.chat.config.animation == "none") {
        $chatElement.show();
    } else {
        $chatElement.show(window.chat.config.animation, {
            easing: "easeOutQuint",
            direction: "down"
        });
    }

    if(sticky) window.chat.sticky = true;

    window.chat.count++;
    window.chat.cur_count++;

    if(sticky || window.chat.config.chatFade != 0) {
        var fadeTime = sticky ? 10000 : window.chat.config.chatFade * 1000;
        if(window.chat.config.animation == "none") {
            $chatElement.delay(fadeTime).hide(0, function() {
                $(this).remove();
                window.chat.count--;
                window.chat.sticky = false;
            });
        } else {
            $chatElement.delay(fadeTime).hide(window.chat.config.animation, 1000, function() {
                $(this).remove();
                window.chat.count--;
                window.chat.sticky = false;
            });
        }

        if(window.chat.count > window.chat.maxcount) {
            window.chat.count--;
            $remove_temp = $(".chat_container div.chat_div:first-child");
            $remove_temp.remove();
        }

        if(window.chat.cur_count > window.chat.maxcount) {
            window.chat.cur_count = 0;
        }
    } else {
        if(window.chat.count > window.chat.maxcount) {
            window.chat.count--;
            $remove_temp = $(".chat_container div.chat_div:first-child");
            $remove_temp.remove();
        }

        if(window.chat.cur_count > window.chat.maxcount) {
            window.chat.cur_count = 0;
        }
    }
}

function connect_twitch() {
    window.chat.socket = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

    window.chat.socket.onopen = function(event) {
        window.chat.socket.send("PASS " + Math.floor((Math.random() * 9999) + 1000));
        window.chat.socket.send("NICK justinfan" + Math.floor((Math.random() * 9999) + 1000));
    };
    window.chat.socket.onmessage = function(event) {
        // connect to channel and request tags/membership
        if(!window.chat.isInited && event.data.indexOf("maze") !== -1) {
            window.chat.socket.send("JOIN #" + window.config.channelname);
            window.chat.socket.send("CAP REQ :twitch.tv/tags twitch.tv/membership");
            addChatMessage("info", "불러오는중", window.config.channelname + " 채널에 연결되었습니다.", true, false);
            window.chat.isInited = true;
            addChatMessage("info", "NOTITLE", "<span class='logo'><pre>   ________          __  ___              _      __ _  __[br]  / ____/ /_  ____ _/ /_/   |  __________(_)____/ /| |/ /[br] / /   / __ <span class='backslash'>\\</span>/ __ `/ __/ /| | / ___/ ___/ / ___/ __/   /[br]/ /___/ / / / /_/ / /_/ ___ |(__  |__  ) (__  ) /_/   |[br]<span class='backslash'>\\</span>____/_/ /_/<span class='backslash'>\\</span>__,_/<span class='backslash'>\\</span>__/_/  |_/____/____/_/____/<span class='backslash'>\\</span>__/_/|_|</pre></span><span class='versionstring'><pre>[br]V E R S I O N      V. " + window.chat.version + "[br]초 기 화    성 공</pre></span>", true, true);
        } else if(event.data.indexOf("PING :tmi.twitch.tv") !== -1) {
            window.chat.socket.send("PONG :tmi.twitch.tv");
        } else if(event.data.indexOf(";") !== -1) {
            var ext_args = {};
            ext_args.isStreamer = false;
            ext_args.isMod = false;
            ext_args.rawprint = false;
            ext_args.emotes = void 0;
            ext_args.color = void 0;
            ext_args.subscriber = false;

            rawMessage = event.data.split(";");
            message = {};
            message.body = event.data.split("PRIVMSG #" + window.config.channelname + " :").pop().htmlEntities().replace("\r", "").replace("\n", "").replace(decodeURI("%01") + "ACTION ", "").replace(decodeURI("%01"), "");
            while(rawMessage.length > 0) {
                parseObj = rawMessage.pop();
                if(parseObj.split("=").length > 1) {
                    message[parseObj.split("=")[0]] = parseObj.split("=")[1];
                }
            }

            ext_args.id = message['user-id'];
            if(message.badges.indexOf("broadcaster/1") != -1) {
                ext_args.isStreamer = true;
                ext_args.isMod = true;
                ext_args.subscriber = true;
            } else if(message.mod == "1") {
                ext_args.isStreamer = false;
                ext_args.isMod = true;
            }

            if(message.subscriber == "1") {
                ext_args.subscriber = true;
            }

            if(message.emotes !== "emotes") {
                ext_args.emotes = message.emotes;
            }

            if(message.color !== "color") {
                ext_args.color = message.color;
            }

            if(window.chat.config.debug) console.log(message);
            if(window.chat.config.debug) console.log(ext_args);

            addChatMessage("twitch", message['display-name'].htmlEntities(), message.body, false, ext_args);
        }
    };
}

$(document).ready(function() {
    CompileChat();
    LoadEmoticon();
});
