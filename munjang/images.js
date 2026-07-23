/* ============================================================
   문장 탐험대 · 그림 연결 파일 (자동 로드됨)
   ------------------------------------------------------------
   큐시트(sentence_game_cuesheet.xlsx) 03시트의 파일명을 그대로 키로 사용.
   images/ 폴더의 실제 그림(웹 최적화 WebP)을 각 키에 연결합니다.
   원본 PNG를 그대로 쓰려면 경로를 '....png'로 바꾸세요.
   ============================================================ */
window.IMG = window.IMG || {};

/* --- 캐릭터 --- */
window.IMG['character_explorer_boy']    = 'images/character_explorer_boy.webp';    // 남아 탐험가(돋보기) = 로미
window.IMG['character_explorer_girl']   = 'images/character_explorer_girl.webp';   // 여아 탐험가(책) = 소소
window.IMG['character_explorer_child']  = 'images/character_explorer_child.webp';  // 탐험가 아동(망원경) = 나루
window.IMG['character_sentence_robot']  = 'images/character_sentence_robot.webp';  // 문장 로봇

/* --- AI 선생님 표정 캐릭터 (문장구조_1회차_AI피드백.html 채점 반응용, 투명 WebP) --- */
window.IMG['teacher_guide']     = 'images/teacher_guide.webp';      // 기본 안내
window.IMG['teacher_thinking']  = 'images/teacher_thinking.webp';   // 고민
window.IMG['teacher_praise']    = 'images/teacher_praise.webp';     // 칭찬
window.IMG['teacher_explain']   = 'images/teacher_explain.webp';    // 설명
window.IMG['teacher_listening'] = 'images/teacher_listening.webp';  // 경청
window.IMG['teacher_retry']     = 'images/teacher_retry.webp';      // 응원(다시 해보자)
window.IMG['teacher_aha']       = 'images/teacher_aha.webp';        // 아하!
window.IMG['teacher_surprised'] = 'images/teacher_surprised.webp';  // 당황(깜짝 놀람)
/* 미제작: teacher_celebrate(축하), teacher_confused(헷갈림) → faceHTML에서 유사 표정으로 대체 */

/* --- 문장 성분 아이콘 --- */
window.IMG['icon_sentence_who']      = 'images/icon_sentence_who.webp';       // 누가
window.IMG['icon_sentence_state']    = 'images/icon_sentence_state.webp';     // 어떠하다
window.IMG['icon_sentence_action']   = 'images/icon_sentence_action.webp';    // 어찌하다
window.IMG['icon_sentence_identity'] = 'images/icon_sentence_identity.webp';  // 무엇이다

/* --- 문장부호 아이콘 --- */
window.IMG['icon_punctuation_comma']       = 'images/icon_punctuation_comma.webp';        // 쉼표
window.IMG['icon_punctuation_question']    = 'images/icon_punctuation_question.webp';     // 물음표
window.IMG['icon_punctuation_exclamation'] = 'images/icon_punctuation_exclamation.webp';  // 느낌표

/* --- 장면 --- */
window.IMG['scene_family_music']     = 'images/scene_family_music.webp';      // 가족 음악 활동
window.IMG['scene_fruit_market']     = 'images/scene_fruit_market.webp';      // 과일 시장
window.IMG['scene_school_hallway']   = 'images/scene_school_hallway.webp';    // 학교 복도
window.IMG['scene_butterfly_garden'] = 'images/scene_butterfly_garden.webp';  // 나비·강아지·꽃
window.IMG['scene_ant_grasshopper']  = 'images/scene_ant_grasshopper.webp';   // 개미와 베짱이

/* --- 1:1 개별 장면 (v2: 그림 보고 문장 고르기 · 누가 찾기) --- */
window.IMG['scene_baby_laughing']            = 'images/scene_baby_laughing.webp';            // 아기가 웃는다
window.IMG['scene_dog_running']              = 'images/scene_dog_running.webp';              // 강아지가 달린다
window.IMG['scene_boys_running']             = 'images/scene_boys_running.webp';             // 남자아이들이 달린다
window.IMG['scene_monkey_eating_banana']     = 'images/scene_monkey_eating_banana.webp';     // 원숭이가 바나나를 먹는다
window.IMG['scene_grandmother_cooking']      = 'images/scene_grandmother_cooking.webp';      // 할머니가 요리한다
window.IMG['scene_soccer_player_kicking_ball']='images/scene_soccer_player_kicking_ball.webp'; // 선수가 공을 찬다
window.IMG['scene_yellow_butterfly_flying']  = 'images/scene_yellow_butterfly_flying.webp';   // 노란 나비가 날아간다
window.IMG['scene_boy_reading_book']         = 'images/scene_boy_reading_book.webp';          // 소년이 책을 읽는다
window.IMG['scene_cat_sleeping']             = 'images/scene_cat_sleeping.webp';             // 고양이가 잠을 잔다
window.IMG['scene_turtle_crawling']          = 'images/scene_turtle_crawling.webp';          // 거북이가 기어간다

/* --- 4·5페이지 힌트 그림 (그림 받으면 아래 주석을 풀어 연결하세요) --- */
/* 4페이지 어떠하다(상태·성질) — 5장 필요 */
// window.IMG['scene_baby_cute']    = 'images/scene_baby_cute.webp';      // 아기는 귀엽다
// window.IMG['scene_hallway_noisy']= 'images/scene_hallway_noisy.webp';  // 복도는 시끄럽다
// window.IMG['scene_rose_pretty']  = 'images/scene_rose_pretty.webp';    // 장미꽃은 예쁘다
// window.IMG['scene_sky_blue']     = 'images/scene_sky_blue.webp';       // 하늘은 파랗다
// window.IMG['scene_apple_red']    = 'images/scene_apple_red.webp';      // 사과는 빨갛다
/* 5페이지 어찌하다(움직임) — 대부분 기존 그림 재사용, 빗방울만 새로 필요 */
// window.IMG['scene_rain_falling'] = 'images/scene_rain_falling.webp';   // 빗방울이 떨어진다 (신규)

/* ============================================================
   문장구조_1회차.html 에 필요한 신규 그림 (PNG 업로드하면 WebP로 변환·연결)
   업로드 위치: C:\Users\rupin\Documents\Codex\이미지\<파일명>.png
   변환·연결 후 아래 주석을 풀면 됩니다.
   ============================================================ */
/* 3페이지 어떠하다 문장 그림 (고양이는 scene_cat_sleeping 재사용, 5장 신규) */
window.IMG['scene_flower_pretty'] = 'images/scene_flower_pretty.webp';  // 꽃은 예쁘다
window.IMG['scene_sky_blue']      = 'images/scene_sky_blue.webp';       // 하늘은 파랗다
window.IMG['scene_baby_cute']     = 'images/scene_baby_cute.webp';      // 아기는 귀엽다
window.IMG['scene_hallway_noisy'] = 'images/scene_hallway_noisy.webp';  // 복도는 시끄럽다
window.IMG['scene_snow_white']    = 'images/scene_snow_white.webp';     // 눈은 하얗다
/* 6페이지 이름·범주 그림 (나비는 scene_yellow_butterfly_flying 재사용, 3장 신규) */
window.IMG['scene_banana']        = 'images/scene_banana.webp';         // 바나나 (범주: 과일)
window.IMG['scene_whale']         = 'images/scene_whale.webp';          // 고래 (범주: 동물)
window.IMG['scene_rose']          = 'images/scene_rose.webp';           // 장미 (범주: 꽃)

/* ============================================================
   2·3페이지(어떠하다) + 4·5페이지(어찌하다) 공용 대상 그림
   ★ 같은 그림 한 장이 '상태(어떠하다)'와 '움직임(어찌하다)'을 동시에 보이도록 제작
   업로드 위치: C:\Users\rupin\Documents\Codex\이미지\<파일명>.png  (1:1, 흰 배경)
   업로드하면 아래 주석을 풀어 연결합니다. (고양이는 scene_cat_sleeping 재사용)
   ============================================================ */
/* 상태용 그림 (2·3페이지) */
window.IMG['scene_icecream'] = 'images/scene_icecream.webp';  // 온전한 초코 콘: 차갑다·달다·바삭하다·맛있다
window.IMG['scene_slime']    = 'images/scene_slime.webp';     // 알록달록 슬라임: 말랑·끈적·미끌·알록달록
window.IMG['scene_dinosaur'] = 'images/scene_dinosaur.webp';  // 큰 공룡: 크다·힘세다·무섭다·단단하다 + 걷는다
window.IMG['scene_ant']      = 'images/scene_ant.webp';       // 부스러기 나르는 개미: 작다·까맣다·부지런하다 + 나른다·기어간다
window.IMG['scene_child']    = 'images/scene_child.webp';     // 달리는 아이: 즐겁다·활발하다·씩씩하다 + 달린다·뛴다
/* 움직임용 변형 그림 (4·5페이지) — 상황이 달라 별도 제작 */
window.IMG['scene_icecream_melt'] = 'images/scene_icecream_melt.webp'; // 녹아 흐르고 한 스쿱 뚝 떨어진 아이스크림: 녹는다·떨어진다
window.IMG['scene_slime_stretch'] = 'images/scene_slime_stretch.webp'; // 쭉 늘리거나 머리카락에 붙어 늘어진 슬라임: 늘어난다·흐른다
